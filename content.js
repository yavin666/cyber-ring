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
            <p class="text2">风有在吹吗？</p>
          </div>
        </div>
        
        <!-- 连接线2 (约束2到约束3) -->
        <div class="line2"></div>
        
        <!-- 飘带长方形 -->
        <div class="frame">
          <div class="group4">
            <div class="rectangle1">
              <p class="text">叮<br />鈴</p>
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
   * 物理模拟类 - 处理风铃的摆动效果
   * 实现真实的物理传导机制，力从底部元素向上逐级传递
   */
  class PhysicsSimulator {
    constructor() {
      // 长方形元素（底部，直接受风力影响）
      this.rectangle = {
        angle: 0,
        velocity: 0,
        angularVelocity: 0,
        damping: 0.98,
        mass: 1.0,
        length: 80, // 连接线长度
        restoreForce: 0.02 // 回复力系数
      };
      
      // 菱形元素（中部，通过连接线受长方形影响）
      this.diamond = {
        angle: 0,
        velocity: 0,
        angularVelocity: 0,
        damping: 0.96, // 降低阻尼，让运动更流畅
        mass: 3.0, // 增加质量，模拟更重的菱形
        length: 43, // 连接线长度
        restoreForce: 0.008, // 进一步减少回复力，让运动更自然
        smoothingFactor: 0.85 // 添加平滑因子
      };
      
      // 连接线元素
      this.line1 = { angle: 0 }; // 顶部连接线
      this.line2 = { angle: 0 }; // 中部连接线
      
      // 物理参数
      this.gravity = 0.2; // 降低重力，让运动更缓慢
      this.connectionStiffness = 0.025; // 进一步降低连接刚度
      this.isActive = false;
      this.animationId = null;
      
      // 平滑运动参数
      this.previousDiamondAngle = 0;
      this.angleChangeBuffer = [];
    }

    /**
     * 应用风力效果
     * @param {number} windForce - 风力大小
     * @param {number} windDirection - 风向 (1为右，-1为左)
     */
    applyWind(windForce, windDirection) {
      // 风力主要作用于底部的长方形元素
      const adjustedForce = windForce / this.rectangle.mass;
      this.rectangle.angularVelocity += adjustedForce * windDirection;
      
      // 微弱的风力也会直接影响菱形（空气阻力）
      this.diamond.angularVelocity += adjustedForce * windDirection * 0.1; // 进一步减少直接风力影响
    }

    /**
     * 更新物理状态
     */
    update() {
      // 更新长方形物理状态（底部元素，直接受重力和风力影响）
      this.updateRectangle();
      
      // 更新菱形物理状态（受长方形运动影响）
      this.updateDiamond();
      
      // 更新连接线角度
      this.updateConnections();
      
      // 应用变换
      this.applyTransforms();

      // 检查是否需要继续动画
      if (this.shouldContinueAnimation()) {
        this.animationId = requestAnimationFrame(() => this.update());
      } else {
        this.isActive = false;
        this.reset();
      }
    }
    
    /**
     * 更新长方形元素的物理状态
     */
    updateRectangle() {
      // 重力作用
      const gravityForce = -this.gravity * Math.sin(this.rectangle.angle) / this.rectangle.mass;
      this.rectangle.angularVelocity += gravityForce * this.rectangle.restoreForce;
      
      // 更新角度和速度
      this.rectangle.angle += this.rectangle.angularVelocity;
      this.rectangle.angularVelocity *= this.rectangle.damping;
      
      // 限制摆动幅度
      this.rectangle.angle = Math.max(-0.4, Math.min(0.4, this.rectangle.angle));
    }
    
    /**
     * 更新菱形元素的物理状态
     */
    updateDiamond() {
      // 重力作用（更温和的重力效果）
      const gravityForce = -this.gravity * Math.sin(this.diamond.angle) / this.diamond.mass;
      this.diamond.angularVelocity += gravityForce * this.diamond.restoreForce;
      
      // 连接约束：长方形的运动通过连接线传递给菱形
      const connectionForce = (this.rectangle.angle - this.diamond.angle) * this.connectionStiffness;
      // 考虑质量差异，重的菱形对传导力响应更小
      const dampedConnectionForce = connectionForce / this.diamond.mass * 0.7; // 进一步减少传导力
      this.diamond.angularVelocity += dampedConnectionForce;
      
      // 平滑角速度变化
      this.diamond.angularVelocity *= this.diamond.damping;
      
      // 计算新角度
      let newAngle = this.diamond.angle + this.diamond.angularVelocity;
      
      // 角度平滑处理
      const angleDiff = newAngle - this.previousDiamondAngle;
      if (Math.abs(angleDiff) > 0.01) {
        // 如果角度变化过大，进行平滑处理
        newAngle = this.previousDiamondAngle + angleDiff * this.diamond.smoothingFactor;
      }
      
      // 更新角度
      this.diamond.angle = newAngle;
      this.previousDiamondAngle = this.diamond.angle;
      
      // 限制摆动幅度（菱形运动幅度更小）
      this.diamond.angle = Math.max(-0.12, Math.min(0.12, this.diamond.angle));
    }
    
    /**
     * 更新连接线角度
     */
    updateConnections() {
      // line1 平滑跟随菱形运动
      this.line1.angle = this.diamond.angle * 0.9;
      
      // line2 在菱形和长方形之间更平滑的插值
      this.line2.angle = this.diamond.angle * 0.6 + this.rectangle.angle * 0.4;
    }
    
    /**
     * 检查是否应该继续动画
     */
    shouldContinueAnimation() {
      const threshold = 0.001;
      return Math.abs(this.rectangle.angularVelocity) > threshold ||
             Math.abs(this.diamond.angularVelocity) > threshold ||
             Math.abs(this.rectangle.angle) > threshold ||
             Math.abs(this.diamond.angle) > threshold;
    }

    /**
     * 应用CSS变换
     */
    applyTransforms() {
      const container = document.getElementById('cyber-ring-container');
      if (!container) return;

      const frame2 = container.querySelector('.frame2'); // 菱形
      const frame = container.querySelector('.frame');   // 长方形
      const line1 = container.querySelector('.line1');   // 顶部连接线
      const line2 = container.querySelector('.line2');   // 中部连接线
      const frame3 = container.querySelector('.frame3'); // 控制按钮

      // 菱形跟随自身角度
      if (frame2) {
        frame2.style.transform = `rotate(${this.diamond.angle}rad)`;
      }
      
      // 长方形跟随自身角度
      if (frame) {
        frame.style.transform = `rotate(${this.rectangle.angle}rad)`;
      }
      
      // 顶部连接线跟随菱形
      if (line1) {
        line1.style.transform = `rotate(${this.line1.angle}rad)`;
      }
      
      // 中部连接线在菱形和长方形之间
      if (line2) {
        line2.style.transform = `rotate(${this.line2.angle}rad)`;
      }
      
      // 控制按钮跟随菱形（保持相对位置）
      if (frame3) {
        frame3.style.transform = `rotate(${this.diamond.angle}rad)`;
      }
    }

    /**
     * 开始物理模拟
     */
    start() {
      if (!this.isActive) {
        this.isActive = true;
        this.update();
      }
    }

    /**
     * 重置到静止状态
     */
    reset() {
      // 重置长方形状态
      this.rectangle.angle = 0;
      this.rectangle.angularVelocity = 0;
      
      // 重置菱形状态
      this.diamond.angle = 0;
      this.diamond.angularVelocity = 0;
      
      // 重置连接线
      this.line1.angle = 0;
      this.line2.angle = 0;
      
      // 重置平滑参数
      this.previousDiamondAngle = 0;
      this.angleChangeBuffer = [];
      
      this.applyTransforms();
    }

    /**
     * 停止动画
     */
    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.isActive = false;
    }
  }

  /**
   * 鼠标交互处理类
   */
  class MouseInteraction {
    constructor(physics) {
      this.physics = physics;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.lastTime = 0;
      this.isHovering = false;
      this.leaveTimeout = null;
    }

    /**
     * 初始化事件监听
     */
    init() {
      const container = document.getElementById('cyber-ring-container');
      if (!container) return;

      container.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
      container.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
      container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    /**
     * 处理鼠标进入
     */
    handleMouseEnter(e) {
      this.isHovering = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.lastTime = Date.now();
      
      if (this.leaveTimeout) {
        clearTimeout(this.leaveTimeout);
        this.leaveTimeout = null;
      }
    }

    /**
     * 处理鼠标离开
     */
    handleMouseLeave(e) {
      this.isHovering = false;
      
      // 延迟恢复静止状态
      this.leaveTimeout = setTimeout(() => {
        if (!this.isHovering) {
          this.physics.stop();
          this.smoothReset();
        }
      }, 1000);
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
      if (!this.isHovering) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastTime;
      
      if (deltaTime > 16) { // 限制更新频率
        const deltaX = e.clientX - this.lastMouseX;
        const speed = Math.abs(deltaX) / deltaTime;
        // 修正风力方向：鼠标向右移动时风铃向右摆动，向左移动时向左摆动
        const direction = deltaX > 0 ? -1 : 1;
        
        // 计算风力 - 降低风力强度使摆动更柔和
        const windForce = Math.min(speed * 0.05, 0.03);
        
        if (windForce > 0.001) {
          this.physics.applyWind(windForce, direction);
          this.physics.start();
        }
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.lastTime = currentTime;
      }
    }

    /**
     * 平滑重置到静止状态
     */
    smoothReset() {
      const resetStep = () => {
        // 逐渐减小角度和角速度
        this.physics.rectangle.angle *= 0.9;
        this.physics.rectangle.angularVelocity *= 0.9;
        this.physics.diamond.angle *= 0.9;
        this.physics.diamond.angularVelocity *= 0.9;
        
        // 更新连接线角度
        this.physics.updateConnections();
        this.physics.applyTransforms();

        // 如果还有明显的运动，继续重置
        if (Math.abs(this.physics.rectangle.angle) > 0.01 || Math.abs(this.physics.rectangle.angularVelocity) > 0.01 ||
            Math.abs(this.physics.diamond.angle) > 0.01 || Math.abs(this.physics.diamond.angularVelocity) > 0.01) {
          requestAnimationFrame(resetStep);
        } else {
          this.physics.reset();
        }
      };
      resetStep();
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
    mouseInteraction.init();
    
    console.log('赛博风铃插件已加载');
  }

  // 等待DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}