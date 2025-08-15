/**
 * 赛博风铃 Chrome 插件 - Content Script
 * 在页面右上角显示可交互的风铃组件
 */

// 防止重复注入
if (!window.cyberRingInjected) {
  window.cyberRingInjected = true;

  /**
   * 创建风铃容器元素
   */
  function createCyberRing() {
    const container = document.createElement('div');
    container.id = 'cyber-ring-container';
    container.innerHTML = `
      <div class="cyber-ring">
        <!-- 连接线1 (约束1到菱形顶点) -->
        <div class="line1"></div>
        
        <!-- 菱形风铃主体 -->
        <div class="frame2">
          <div class="union">
            <p class="text2">風有在吹嗎？</p>
          </div>
        </div>
        
        <!-- 连接线2 (约束2到约束3) -->
        <div class="line2"></div>
        
        <!-- 飘带长方形 -->
        <div class="frame">
          <div class="group4">
            <div class="rectangle1">
              <p class="text">叮鈴——</p>
            </div>
          </div>
          <div class="line22">
            <p class="control-text yes">yes</p>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="frame3">
          <p class="control-text no">no</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  /**
   * 运动状态控制器类 - 控制"yes"/"no"文本显示
   */
  class MotionStatusController {
    constructor() {
      this.isMoving = false;
      this.yesElement = null;
      this.noElement = null;
      
      // 音频相关属性
      this.audio = null;
      this.audioLoaded = false;
      this.userInteracted = false;
      this.pendingPlay = false;
      
      this.init();
    }

    /**
     * 初始化DOM元素引用和音频加载
     */
    init() {
      const container = document.getElementById('cyber-ring-container');
      if (container) {
        this.yesElement = container.querySelector('.control-text.yes');
        this.noElement = container.querySelector('.control-text.no');
        // 初始状态显示"no"
        this.updateDisplay(false);
      }
      
      // 初始化音频
      this.initAudio();
      
      // 设置用户交互监听器
      this.setupUserInteractionListeners();
    }
    
    /**
     * 初始化音频文件
     */
    initAudio() {
      try {
        // 获取音频文件URL
        const audioUrl = chrome.runtime.getURL('ring.mp3');
        
        // 创建音频对象
        this.audio = new Audio(audioUrl);
        
        // 设置音频属性
        this.audio.volume = 0.3;
        this.audio.preload = 'auto';
        
        // 简单的加载完成监听
        this.audio.addEventListener('canplaythrough', () => {
          this.audioLoaded = true;
        });
        
        this.audio.addEventListener('error', () => {
          console.error('[风铃音效] 音频加载失败');
          this.audioLoaded = false;
        });
        
      } catch (error) {
        console.error('[风铃音效] 音频初始化失败:', error);
      }
    }
    

    

    

    

    

    

    

    

    


    /**
     * 更新运动状态显示
     * @param {boolean} isMoving - 是否处于运动状态
     */
    updateStatus(isMoving) {
      if (this.isMoving !== isMoving) {
        // 检测到运动状态从静止变为运动时播放音效
        if (!this.isMoving && isMoving) {
          this.playRingSound();
        }
        
        this.isMoving = isMoving;
        this.updateDisplay(isMoving);
      }
    }
    
    /**
     * 设置用户交互监听器
     */
    setupUserInteractionListeners() {
      const unlockAudio = () => {
        if (!this.userInteracted) {
          this.userInteracted = true;
          console.log('[风铃音效] 检测到用户交互');
          
          // 如果有待播放的音效，现在播放
          if (this.pendingPlay) {
            this.pendingPlay = false;
            this.playRingSound();
          }
        }
      };
      
      // 监听多种用户交互事件
      const events = ['click', 'touchstart', 'keydown', 'mousedown'];
      events.forEach(event => {
        document.addEventListener(event, unlockAudio, { once: true, passive: true });
      });
    }
    

    
    /**
     * 播放风铃音效
     */
    async playRingSound() {
      try {
        // 检查音频是否已加载
        if (!this.audioLoaded || !this.audio) {
          console.warn('[风铃音效] 音频未加载，跳过播放');
          return;
        }
        
        // 检查是否需要用户交互来解锁音频
        if (!this.userInteracted) {
          console.warn('[风铃音效] 需要用户交互来解锁音频，标记为待播放');
          this.pendingPlay = true;
          this.showAudioTip();
          return;
        }
        
        // 重置音频到开始位置
        this.audio.currentTime = 0;
        
        console.log('[风铃音效] 开始播放音效');
        
        // 播放音效
        const playPromise = this.audio.play();
        
        // 处理播放Promise（现代浏览器要求）
        if (playPromise !== undefined) {
          await playPromise;
          console.log('[风铃音效] 音效播放成功');
        }
        
      } catch (error) {
        console.error('[风铃音效] 播放失败:', error);
        
        // 简化的错误处理
        if (error.name === 'NotAllowedError') {
          console.warn('[风铃音效] 浏览器阻止自动播放，需要用户交互后才能播放');
          this.pendingPlay = true;
          this.showAudioTip();
        }
      }
    }
    
    /**
     * 显示音频提示信息
     */
    showAudioTip() {
      // 创建一个临时提示元素
      const tip = document.createElement('div');
      tip.textContent = '🎐 点击页面任意位置启用风铃音效';
      tip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      
      document.body.appendChild(tip);
      
      // 3秒后自动移除提示
      setTimeout(() => {
        tip.style.opacity = '0';
        setTimeout(() => {
          if (tip.parentNode) {
            tip.parentNode.removeChild(tip);
          }
        }, 300);
      }, 3000);
    }

    /**
     * 更新文本显示
     * @param {boolean} showYes - 是否显示"yes"文本
     */
    updateDisplay(showYes) {
      if (this.yesElement && this.noElement) {
        if (showYes) {
          this.yesElement.style.display = 'block';
          this.noElement.style.display = 'none';
        } else {
          this.yesElement.style.display = 'none';
          this.noElement.style.display = 'block';
        }
      }
    }
  }

  /**
   * 物理模拟器类 - 基于真实单摆物理学
   */
  class PhysicsSimulator {
    constructor() {
      // 物理常数
      this.gravity = 9.81;           // 重力加速度 (m/s²)
      this.timeScale = 0.016;        // 时间缩放因子，控制动画速度
      this.maxTimeStep = 0.02;       // 最大时间步长，防止不稳定
      
      // 长方形摆锤参数（底部重物）
      this.rectangle = {
        length: 0.3,                 // 摆长 (m)
        mass: 2.0,                   // 质量 (kg)
        damping: 0.98,               // 阻尼系数
        momentOfInertia: 0.1,        // 转动惯量
        angle: 0,                    // 当前角度 (rad)
        angularVelocity: 0,          // 角速度 (rad/s)
        maxAngle: Math.PI / 3,       // 最大摆动角度限制
        externalForce: 0             // 外力
      };
      
      // 菱形摆锤参数（顶部轻物）
      this.diamond = {
        length: 0.25,                // 摆长 (m)
        mass: 0.8,                   // 质量 (kg)
        damping: 0.95,               // 阻尼系数
        momentOfInertia: 0.05,       // 转动惯量
        angle: 0,                    // 当前角度 (rad)
        angularVelocity: 0,          // 角速度 (rad/s)
        maxAngle: Math.PI / 4,       // 最大摆动角度限制
        couplingStrength: 0.3,       // 与长方形的耦合强度
        externalForce: 0             // 外力
      };
      
      // 连接线参数
      this.line1 = { angle: 0 };
      this.line2 = { angle: 0 };
      
      // 外力参数
      this.externalForce = {
        magnitude: 0,                // 外力大小
        direction: 0,                // 外力方向 (-1: 左, 1: 右)
        decay: 0.95                  // 外力衰减率
      };
      
      // 动画控制
      this.isRunning = false;
      this.animationId = null;
      this.lastTime = 0;
      
      // 运动状态控制器
      this.motionStatusController = new MotionStatusController();
    }

    /**
     * 应用外力（风力或鼠标交互力）
     * @param {number} forceMagnitude - 力的大小
     * @param {number} direction - 力的方向 (1为右，-1为左)
     */
    applyForce(forceMagnitude, direction) {
      // 设置外力参数
      this.externalForce.magnitude = forceMagnitude;
      this.externalForce.direction = direction;
      
      // 外力主要作用于底部的长方形摆锤
      // 使用力矩公式：τ = F × r × sin(θ)
      const torque = forceMagnitude * this.rectangle.length * direction;
      
      // 根据牛顿第二定律计算角加速度：α = τ / I
      const angularAcceleration = torque / this.rectangle.momentOfInertia;
      
      // 应用冲量改变角速度
      this.rectangle.angularVelocity += angularAcceleration * this.timeScale;
      
      // 限制最大角速度，防止过度摆动
      const maxAngularVelocity = 8.0;
      this.rectangle.angularVelocity = Math.max(-maxAngularVelocity, 
        Math.min(maxAngularVelocity, this.rectangle.angularVelocity));
    }
    
    /**
     * 计算单摆的重力恢复力矩
     * @param {Object} pendulum - 摆锤对象
     * @returns {number} 重力力矩
     */
    calculateGravityTorque(pendulum) {
      // 重力恢复力矩：τ = -m × g × L × sin(θ)
      return -pendulum.mass * this.gravity * pendulum.length * Math.sin(pendulum.angle);
    }

    /**
     * 更新物理状态 - 主循环
     */
    update(currentTime = performance.now()) {
      // 计算时间步长
      const deltaTime = this.lastTime ? (currentTime - this.lastTime) * 0.001 : this.timeScale;
      this.lastTime = currentTime;
      
      // 限制时间步长，防止数值不稳定
      const clampedDeltaTime = Math.min(deltaTime, 0.033); // 最大30fps
      
      // 更新长方形摆锤（底部元素）
      this.updatePendulum(this.rectangle, clampedDeltaTime);
      
      // 更新菱形主体（受长方形影响）
      this.updateCoupledPendulum(this.diamond, this.rectangle, clampedDeltaTime);
      
      // 更新连接线角度
      this.updateConnections();
      
      // 应用CSS变换
      this.applyTransforms();
      
      // 衰减外力
      this.externalForce.magnitude *= this.externalForce.decay;
      
      // 更新运动状态显示
      const isMoving = this.shouldContinueAnimation();
      this.motionStatusController.updateStatus(isMoving);
      
      // 检查是否继续动画
      if (isMoving) {
        this.animationId = requestAnimationFrame((time) => this.update(time));
      } else {
        this.stop();
      }
    }
    
    /**
     * 更新单个摆锤的物理状态
     * @param {Object} pendulum - 摆锤对象
     * @param {number} deltaTime - 时间步长
     */
    updatePendulum(pendulum, deltaTime) {
      // 计算重力恢复力矩
      const gravityTorque = this.calculateGravityTorque(pendulum);
      
      // 计算外力力矩（仅对长方形摆锤）
      let externalTorque = 0;
      if (pendulum === this.rectangle && this.externalForce.magnitude > 0) {
        externalTorque = this.externalForce.magnitude * pendulum.length * this.externalForce.direction;
      }
      
      // 计算总力矩
      const totalTorque = gravityTorque + externalTorque;
      
      // 根据牛顿第二定律计算角加速度：α = τ / I
      const angularAcceleration = totalTorque / pendulum.momentOfInertia;
      
      // 更新角速度（考虑阻尼）
      pendulum.angularVelocity += angularAcceleration * deltaTime;
      pendulum.angularVelocity *= pendulum.damping;
      
      // 更新角度
      pendulum.angle += pendulum.angularVelocity * deltaTime;
      
      // 限制摆动幅度
      pendulum.angle = Math.max(-pendulum.maxAngle, Math.min(pendulum.maxAngle, pendulum.angle));
    }
    
    /**
     * 更新耦合摆锤的物理状态
     * @param {Object} pendulum - 当前摆锤
     * @param {Object} drivingPendulum - 驱动摆锤
     * @param {number} deltaTime - 时间步长
     */
    updateCoupledPendulum(pendulum, drivingPendulum, deltaTime) {
      // 计算重力恢复力矩
      const gravityTorque = this.calculateGravityTorque(pendulum);
      
      // 计算耦合力矩（来自驱动摆锤的影响）
      const angleDifference = drivingPendulum.angle - pendulum.angle;
      const velocityDifference = drivingPendulum.angularVelocity - pendulum.angularVelocity;
      
      // 弹性耦合力矩（类似弹簧）
      const couplingTorque = pendulum.couplingStrength * angleDifference * pendulum.mass * this.gravity * pendulum.length;
      
      // 阻尼耦合力矩（传递动量）
      const dampingCouplingTorque = 0.05 * velocityDifference * pendulum.momentOfInertia;
      
      // 计算总力矩
      const totalTorque = gravityTorque + couplingTorque + dampingCouplingTorque;
      
      // 根据牛顿第二定律计算角加速度
      const angularAcceleration = totalTorque / pendulum.momentOfInertia;
      
      // 更新角速度（考虑阻尼）
      pendulum.angularVelocity += angularAcceleration * deltaTime;
      pendulum.angularVelocity *= pendulum.damping;
      
      // 更新角度
      pendulum.angle += pendulum.angularVelocity * deltaTime;
      
      // 限制摆动幅度
      pendulum.angle = Math.max(-pendulum.maxAngle, Math.min(pendulum.maxAngle, pendulum.angle));
    }
    

    
    /**
     * 更新连接线角度
     */
    updateConnections() {
      // 顶部连接线跟随菱形运动
      this.line1.angle = this.diamond.angle * 0.8;
      
      // 中部连接线在菱形和长方形之间插值
      this.line2.angle = (this.diamond.angle + this.rectangle.angle) * 0.5;
    }
    
    /**
     * 检查是否应该继续动画
     */
    shouldContinueAnimation() {
      const velocityThreshold = 0.01; // 角速度阈值
      const angleThreshold = 0.001;   // 角度阈值
      const forceThreshold = 0.001;   // 外力阈值
      
      // 如果还有外力作用，继续动画
      if (this.externalForce.magnitude > forceThreshold) {
        return true;
      }
      
      // 检查是否还有明显的运动
      const hasMotion = Math.abs(this.rectangle.angularVelocity) > velocityThreshold ||
                       Math.abs(this.diamond.angularVelocity) > velocityThreshold ||
                       Math.abs(this.rectangle.angle) > angleThreshold ||
                       Math.abs(this.diamond.angle) > angleThreshold;
      
      return hasMotion;
    }

    /**
     * 应用CSS变换
     */
    applyTransforms() {
      const container = document.getElementById('cyber-ring-container');
      if (!container) return;
      
      // 获取DOM元素
      const rectangleElement = container.querySelector('.frame');
      const diamondElement = container.querySelector('.frame2');
      const line1Element = container.querySelector('.line1');
      const line2Element = container.querySelector('.line2');
      
      // 应用长方形变换
      if (rectangleElement) {
        const rectTransform = `rotate(${this.rectangle.angle}rad)`;
        rectangleElement.style.transform = rectTransform;
      }
      
      // 应用菱形变换
      if (diamondElement) {
        const diamondTransform = `rotate(${this.diamond.angle}rad)`;
        diamondElement.style.transform = diamondTransform;
      }
      
      // 应用连接线变换
      if (line1Element) {
        const line1Transform = `rotate(${this.line1.angle}rad)`;
        line1Element.style.transform = line1Transform;
      }
      
      if (line2Element) {
        const line2Transform = `rotate(${this.line2.angle}rad)`;
        line2Element.style.transform = line2Transform;
      }
    }

    /**
     * 启动物理模拟
     */
    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.update();
      }
    }
    
    /**
     * 重置物理状态
     */
    reset() {
      // 重置长方形状态
      this.rectangle.angle = 0;
      this.rectangle.angularVelocity = 0;
      this.rectangle.externalForce = 0;
      
      // 重置菱形状态
      this.diamond.angle = 0;
      this.diamond.angularVelocity = 0;
      this.diamond.externalForce = 0;
      
      // 重置连接线状态
      this.line1.angle = 0;
      this.line2.angle = 0;
      
      // 重置外力
      this.externalForce.magnitude = 0;
      this.externalForce.direction = 0;
      
      // 应用重置后的变换
      this.applyTransforms();
    }
    
    /**
     * 停止物理模拟
     */
    stop() {
      this.isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      // 确保停止时显示"no"
      this.motionStatusController.updateStatus(false);
    }
  }

  /**
   * 鼠标交互处理类
   */
  class MouseInteraction {
    constructor(physicsSimulator) {
      this.physics = physicsSimulator;
      this.isMouseOver = false;
      this.lastX = undefined;
      this.lastDirection = 0;
      this.init();
    }
    
    /**
     * 初始化事件监听
     */
    init() {
      const container = document.getElementById('cyber-ring-container');
      if (!container) return;
      
      container.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
      container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }
    
    /**
     * 鼠标进入处理
     */
    handleMouseEnter() {
      this.isMouseOver = true;
      this.physics.start();
    }
    
    /**
     * 鼠标离开处理
     */
    handleMouseLeave() {
      this.isMouseOver = false;
      this.lastX = undefined;
      // 平滑重置到静止状态
      this.smoothReset();
    }
    
    /**
     * 鼠标移动处理
     */
    handleMouseMove(event) {
      if (!this.isMouseOver) return;
      
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const currentX = event.clientX;
      
      // 计算鼠标相对于中心的位置
      const deltaX = currentX - centerX;
      
      // 计算移动方向和速度
      if (this.lastX !== undefined) {
        const movementX = currentX - this.lastX;
        
        // 只有当移动距离超过阈值时才更新方向
        if (Math.abs(movementX) > 2) {
          // 计算风力方向：修正方向映射，确保鼠标向右移动时风铃向右摆动
          const direction = -Math.sign(movementX);
          this.lastDirection = direction;
          
          // 计算风力强度（大幅增强风力效果）
          const speed = Math.abs(movementX);
          const distance = Math.abs(deltaX);
          const forceMagnitude = Math.min(speed * 0.8 + distance * 0.05, 5.0);
          
          // 应用外力到物理系统
          this.physics.applyForce(forceMagnitude, direction);
        } else if (Math.abs(deltaX) > 10) {
          // 鼠标静止但偏离中心时，施加更强的恢复力
          const direction = -Math.sign(deltaX);
          const distance = Math.abs(deltaX);
          const forceMagnitude = Math.min(distance * 0.02, 1.0);
          
          this.physics.applyForce(forceMagnitude, direction);
        }
      }
      
      this.lastX = currentX;
    }
    
    /**
     * 平滑重置到静止状态
     */
    smoothReset() {
      // 逐渐减少外力，让摆动自然衰减
      const resetAnimation = () => {
        if (this.isMouseOver) return; // 如果鼠标重新进入，停止重置
        
        // 让物理系统自然衰减，不需要人为干预
        // 在一段时间后如果仍然静止则停止模拟
        setTimeout(() => {
          if (!this.isMouseOver && !this.physics.shouldContinueAnimation()) {
            this.physics.stop();
          }
        }, 2000);
      };
      
      requestAnimationFrame(resetAnimation);
    }
  }

  // 初始化插件
  function init() {
    // 创建风铃组件
    createCyberRing();
    
    // 初始化物理模拟
    const physics = new PhysicsSimulator();
    
    // 初始化鼠标交互
    const mouseInteraction = new MouseInteraction(physics);
    
    console.log('赛博风铃插件已加载');
  }

  // 等待DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}