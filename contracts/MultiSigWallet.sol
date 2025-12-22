// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MultiSigWallet
 * @dev 企业级多签钱包合约，支持多个所有者共同管理资金
 */
contract MultiSigWallet {
    // 事件
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint256 required);

    // 所有者地址数组
    address[] public owners;
    // 检查地址是否为所有者
    mapping(address => bool) public isOwner;
    // 执行交易所需的确认数
    uint256 public numConfirmationsRequired;

    // 交易结构
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 expirationTime; // 过期时间（Unix 时间戳，0 表示永不过期）
    }

    // 交易ID => 所有者 => 是否确认
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    // 交易数组
    Transaction[] public transactions;

    // 修饰符
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notExpired(uint256 _txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        require(
            transaction.expirationTime == 0 || block.timestamp <= transaction.expirationTime,
            "tx expired"
        );
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    /**
     * @dev 构造函数
     * @param _owners 所有者地址数组
     * @param _numConfirmationsRequired 执行交易所需的最少确认数
     */
    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    /**
     * @dev 接收以太币
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @dev 提交交易
     * @param _to 目标地址
     * @param _value 转账金额
     * @param _data 调用数据
     * @param _expirationTime 过期时间（Unix 时间戳，0 表示永不过期）
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint256 _expirationTime
    ) public onlyOwner {
        require(
            _expirationTime == 0 || _expirationTime > block.timestamp,
            "expiration time must be in the future"
        );

        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                expirationTime: _expirationTime
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    /**
     * @dev 确认交易
     * @param _txIndex 交易索引
     */
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notExpired(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev 执行交易
     * @param _txIndex 交易索引
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notExpired(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev 撤销确认
     * @param _txIndex 交易索引
     */
    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    /**
     * @dev 获取所有者列表
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev 获取交易数量
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    /**
     * @dev 获取交易详情
     * @param _txIndex 交易索引
     */
    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 expirationTime
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.expirationTime
        );
    }
}

