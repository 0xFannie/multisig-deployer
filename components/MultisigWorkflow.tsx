import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileText, CheckCircle, Send, User, ArrowRight, Network } from 'lucide-react';
import { useTranslation } from 'next-i18next';

const MultisigWorkflow = () => {
  const { t, ready } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);
  const [flowProgress, setFlowProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = useMemo(() => {
    if (!ready || !mounted) {
      return [
        { id: 1, title: '', description: '', icon: Users, participants: 3 },
        { id: 2, title: '', description: '', icon: FileText, participants: 1 },
        { id: 3, title: '', description: '', icon: CheckCircle, participants: 2 },
        { id: 4, title: '', description: '', icon: Send, participants: 1 },
        { id: 5, title: '', description: '', icon: CheckCircle, participants: 3 }
      ];
    }
    return [
      {
        id: 1,
        title: t('index.workflowStep1Title'),
        description: t('index.workflowStep1Desc'),
        icon: Users,
        participants: 3
      },
      {
        id: 2,
        title: t('index.workflowStep2Title'),
        description: t('index.workflowStep2Desc'),
        icon: FileText,
        participants: 1
      },
      {
        id: 3,
        title: t('index.workflowStep3Title'),
        description: t('index.workflowStep3Desc'),
        icon: CheckCircle,
        participants: 2
      },
      {
        id: 4,
        title: t('index.workflowStep4Title'),
        description: t('index.workflowStep4Desc'),
        icon: Send,
        participants: 1
      },
      {
        id: 5,
        title: t('index.workflowStep5Title'),
        description: t('index.workflowStep5Desc'),
        icon: CheckCircle,
        participants: 3
      }
    ];
  }, [t, ready, mounted]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
      setFlowProgress(0);
    }, 4000);

    const progressTimer = setInterval(() => {
      setFlowProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 80);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  // 如果翻译未准备好或组件未挂载，显示加载状态
  if (!ready || !mounted) {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto">
          <div className="relative glass-card rounded-3xl shadow-2xl p-8 md:p-10 overflow-hidden">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">{t('index.howItWorksTitle') || '工作原理'}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        
        {/* 流程图容器 - 标题移到容器内，与其他部分保持一致 */}
        <div className="relative glass-card rounded-3xl shadow-2xl p-8 md:p-10 overflow-hidden">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{t('index.howItWorksTitle')}</h2>
          </div>
          
          {/* 步骤节点容器 - 用于计算进度线位置 */}
          <div className="relative grid grid-cols-5 gap-6">
            
            {/* 横向连接线和进度线的容器 - 固定位置，对齐到步骤圆圈中心 */}
            {/* 计算：参与者区域(64px) + 间距(24px) + 流动效果(24px) + 间距(8px) + 圆圈中心(40px) = 160px */}
            <div 
              className="absolute left-0 right-0 pointer-events-none z-10"
              style={{ 
                top: '160px',
                height: '1px'
              }}
            >
              {/* 横向连接线 - 从第一个节点中心到最后一个节点中心 */}
              <div className="absolute left-[10%] right-[10%] top-0 h-0.5 bg-primary-gray/30"></div>
              
              {/* 流程进度线 - 精确计算到每个步骤节点中心，确保不超出范围且位置固定 */}
              <div 
                className="absolute left-[10%] top-0 h-0.5 bg-primary-light/50 transition-all duration-1000"
                style={{ 
                  width: activeStep === 0 ? '0%' : `${(activeStep / 4) * 80}%`,
                  maxWidth: '80%'
                }}
              >
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"
                ></div>
              </div>
            </div>

            {/* 步骤节点 */}
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isPassed = activeStep > index;

              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  
                  {/* 参与者图标 - 顶部 */}
                  <div className="flex justify-center items-center gap-2 mb-6 h-16">
                    {Array.from({ length: step.participants }).map((_, i) => (
                      <div
                        key={i}
                        className={`transition-all duration-500 ${
                          isActive ? 'scale-110' : 'scale-100'
                        }`}
                        style={{ 
                          animationDelay: `${i * 100}ms`,
                          animation: isActive ? 'bounce 1s ease-in-out infinite' : 'none'
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${
                          isActive 
                            ? 'bg-primary-light/20 border-2 border-primary-light/50' 
                            : isPassed 
                              ? 'bg-primary-dark/60 border border-primary-gray/40' 
                              : 'bg-primary-dark/50 border border-primary-gray/30'
                        }`}>
                          {/* 第5步显示邮件图标 */}
                          {index === 4 ? (
                            <svg className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-primary-gray'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : index === 3 ? (
                            // 第4步显示区块链图标
                            <Network className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-primary-gray'}`} />
                          ) : (
                            <User className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-primary-gray'}`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 流动效果 - 向下 */}
                  {isActive && (
                    <div className="flex flex-col items-center gap-1 mb-2 h-6">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-white/60 rounded-full animate-ping"
                          style={{ animationDelay: `${i * 200}ms` }}
                        ></div>
                      ))}
                    </div>
                  )}
                  {!isActive && <div className="h-6 mb-2"></div>}

                  {/* 中央：步骤圆圈 */}
                  <div className="relative z-10 flex-shrink-0 mb-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                      isActive
                        ? 'bg-primary-light border-primary-light shadow-2xl shadow-primary-light/30 scale-110'
                        : isPassed
                          ? 'bg-primary-dark/60 border-primary-gray/40'
                          : 'bg-primary-dark/50 border-primary-gray/30'
                    }`}>
                      <Icon className={`w-10 h-10 transition-all duration-500 ${
                        isActive ? 'text-primary-black' : 'text-primary-gray'
                      }`} />
                    </div>
                    
                    {/* 活动指示器 */}
                    {isActive && (
                      <>
                        <div className="absolute -inset-1 border-2 border-white/30 rounded-2xl animate-ping"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
                        </div>
                      </>
                    )}
                    
                    {/* 完成标记 */}
                    {isPassed && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-dark/80 rounded-full flex items-center justify-center border-2 border-primary-black">
                        <CheckCircle className="w-4 h-4 text-primary-gray" />
                      </div>
                    )}
                  </div>

                  {/* 步骤说明 - 底部 */}
                  <div className="w-full">
                    <div className={`rounded-2xl p-4 transition-all duration-500 border ${
                      isActive
                        ? 'bg-primary-dark/60 border-primary-light/30 shadow-xl'
                        : 'bg-primary-dark/40 border-primary-gray/20'
                    }`} style={{ minHeight: '120px' }}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                          isActive ? 'bg-primary-light text-primary-black' : 'bg-primary-dark/60 text-primary-gray'
                        }`}>
                          <span className="font-bold text-sm">{step.id}</span>
                        </div>
                        <h3 className={`text-base font-bold transition-all duration-500 ${
                          isActive ? 'text-white' : 'text-primary-gray'
                        }`}>
                          {step.title}
                        </h3>
                      </div>
                      <p className={`text-xs leading-relaxed transition-all duration-500 ${
                        isActive ? 'text-primary-gray' : 'text-primary-gray/70'
                      }`}>
                        {step.description}
                      </p>
                      
                      {/* 进度条 (仅在步骤3显示，其他步骤保留相同高度) */}
                      <div className="mt-3 h-6">
                        {isActive && index === 2 && (
                          <>
                            <div className="flex justify-between text-xs text-primary-gray mb-1">
                              <span>{t('index.workflowProgressLabel')}</span>
                              <span>2/2</span>
                            </div>
                            <div className="h-1.5 bg-primary-dark/60 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary-light rounded-full transition-all duration-200"
                                style={{ width: `${flowProgress}%` }}
                              ></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 向右箭头 */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                      <ArrowRight className={`w-6 h-6 transition-all duration-500 ${
                        isActive ? 'text-primary-light animate-pulse' : 'text-primary-gray/40'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 完成状态 */}
          {activeStep === 4 && (
            <div className="flex justify-center mt-12">
              <div className="bg-primary-dark/60 px-8 py-4 rounded-2xl border border-primary-light/30 flex items-center gap-3 animate-pulse">
                <CheckCircle className="w-6 h-6 text-primary-light" />
                <span className="text-white font-semibold">{t('index.workflowCompletionMessage')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default MultisigWorkflow;

