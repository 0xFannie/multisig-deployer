const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let multiSigWallet;
  let owner1, owner2, owner3, addr1, addr2;

  beforeEach(async function () {
    [owner1, owner2, owner3, addr1, addr2] = await ethers.getSigners();

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(
      [owner1.address, owner2.address, owner3.address],
      2 // 需要 2 个确认
    );
    await multiSigWallet.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置所有者", async function () {
      expect(await multiSigWallet.isOwner(owner1.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(owner2.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(owner3.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(addr1.address)).to.equal(false);
    });

    it("应该正确设置所需确认数", async function () {
      expect(await multiSigWallet.numConfirmationsRequired()).to.equal(2);
    });

    it("应该正确返回所有者列表", async function () {
      const owners = await multiSigWallet.getOwners();
      expect(owners).to.deep.equal([
        owner1.address,
        owner2.address,
        owner3.address,
      ]);
    });
  });

  describe("接收以太币", function () {
    it("应该能够接收以太币", async function () {
      const amount = ethers.parseEther("1.0");
      
      await expect(
        owner1.sendTransaction({
          to: await multiSigWallet.getAddress(),
          value: amount,
        })
      ).to.changeEtherBalance(multiSigWallet, amount);
    });
  });

  describe("提交交易", function () {
    it("所有者应该能够提交交易", async function () {
      await expect(
        multiSigWallet
          .connect(owner1)
          .submitTransaction(addr1.address, ethers.parseEther("1.0"), "0x")
      )
        .to.emit(multiSigWallet, "SubmitTransaction")
        .withArgs(
          owner1.address,
          0,
          addr1.address,
          ethers.parseEther("1.0"),
          "0x"
        );

      expect(await multiSigWallet.getTransactionCount()).to.equal(1);
    });

    it("非所有者不应该能够提交交易", async function () {
      await expect(
        multiSigWallet
          .connect(addr1)
          .submitTransaction(addr2.address, ethers.parseEther("1.0"), "0x")
      ).to.be.revertedWith("not owner");
    });
  });

  describe("确认交易", function () {
    beforeEach(async function () {
      await multiSigWallet
        .connect(owner1)
        .submitTransaction(addr1.address, ethers.parseEther("1.0"), "0x");
    });

    it("所有者应该能够确认交易", async function () {
      await expect(multiSigWallet.connect(owner2).confirmTransaction(0))
        .to.emit(multiSigWallet, "ConfirmTransaction")
        .withArgs(owner2.address, 0);

      const [, , , , numConfirmations] = await multiSigWallet.getTransaction(0);
      expect(numConfirmations).to.equal(1);
    });

    it("不应该重复确认同一交易", async function () {
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await expect(
        multiSigWallet.connect(owner2).confirmTransaction(0)
      ).to.be.revertedWith("tx already confirmed");
    });

    it("非所有者不应该能够确认交易", async function () {
      await expect(
        multiSigWallet.connect(addr1).confirmTransaction(0)
      ).to.be.revertedWith("not owner");
    });
  });

  describe("执行交易", function () {
    beforeEach(async function () {
      // 向合约发送以太币
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther("2.0"),
      });

      // 提交交易
      await multiSigWallet
        .connect(owner1)
        .submitTransaction(addr1.address, ethers.parseEther("1.0"), "0x");
    });

    it("应该在获得足够确认后执行交易", async function () {
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.connect(owner3).confirmTransaction(0);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(0)
      ).to.changeEtherBalance(addr1, ethers.parseEther("1.0"));

      const [, , , executed] = await multiSigWallet.getTransaction(0);
      expect(executed).to.equal(true);
    });

    it("不应该在确认不足时执行交易", async function () {
      await multiSigWallet.connect(owner2).confirmTransaction(0);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("cannot execute tx");
    });

    it("不应该重复执行同一交易", async function () {
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.connect(owner3).confirmTransaction(0);
      await multiSigWallet.connect(owner1).executeTransaction(0);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("tx already executed");
    });
  });

  describe("撤销确认", function () {
    beforeEach(async function () {
      await multiSigWallet
        .connect(owner1)
        .submitTransaction(addr1.address, ethers.parseEther("1.0"), "0x");
      await multiSigWallet.connect(owner2).confirmTransaction(0);
    });

    it("所有者应该能够撤销确认", async function () {
      await expect(multiSigWallet.connect(owner2).revokeConfirmation(0))
        .to.emit(multiSigWallet, "RevokeConfirmation")
        .withArgs(owner2.address, 0);

      const [, , , , numConfirmations] = await multiSigWallet.getTransaction(0);
      expect(numConfirmations).to.equal(0);
    });

    it("不应该撤销未确认的交易", async function () {
      await expect(
        multiSigWallet.connect(owner3).revokeConfirmation(0)
      ).to.be.revertedWith("tx not confirmed");
    });
  });
});

