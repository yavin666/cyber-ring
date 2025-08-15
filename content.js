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
            <div class="line2-control"></div>
            <p class="control-text yes">yes</p>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="frame3">
          <div class="line1-control"></div>
          <p class="control-text no">no</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  /**
   * 物理模拟类 - 处理风铃的摆动效果
   */
  class PhysicsSimulator {
    constructor() {
      this.pendulum1 = { angle: 0, velocity: 0, damping: 0.98 }; // 菱形
      this.pendulum2 = { angle: 0, velocity: 0, damping: 0.95 }; // 长方形
      this.gravity = 0.5;
      this.isActive = false;
      this.animationId = null;
    }

    /**
     * 应用风力效果
     * @param {number} windForce - 风力大小
     * @param {number} windDirection - 风向 (1为右，-1为左)
     */
    applyWind(windForce, windDirection) {
      // 菱形重量大，受风力影响小
      this.pendulum1.velocity += windForce * windDirection * 0.3;
      // 长方形轻，受风力影响大
      this.pendulum2.velocity += windForce * windDirection * 0.8;
    }

    /**
     * 更新物理状态
     */
    update() {
      // 更新菱形摆动
      this.pendulum1.velocity += -this.gravity * Math.sin(this.pendulum1.angle) * 0.02;
      this.pendulum1.angle += this.pendulum1.velocity;
      this.pendulum1.velocity *= this.pendulum1.damping;

      // 更新长方形摆动
      this.pendulum2.velocity += -this.gravity * Math.sin(this.pendulum2.angle) * 0.03;
      this.pendulum2.angle += this.pendulum2.velocity;
      this.pendulum2.velocity *= this.pendulum2.damping;

      // 限制摆动幅度
      this.pendulum1.angle = Math.max(-0.3, Math.min(0.3, this.pendulum1.angle));
      this.pendulum2.angle = Math.max(-0.5, Math.min(0.5, this.pendulum2.angle));

      // 应用变换
      this.applyTransforms();

      // 检查是否需要继续动画
      if (Math.abs(this.pendulum1.velocity) > 0.001 || Math.abs(this.pendulum2.velocity) > 0.001 ||
          Math.abs(this.pendulum1.angle) > 0.001 || Math.abs(this.pendulum2.angle) > 0.001) {
        this.animationId = requestAnimationFrame(() => this.update());
      } else {
        this.isActive = false;
        this.reset();
      }
    }

    /**
     * 应用CSS变换
     */
    applyTransforms() {
      const container = document.getElementById('cyber-ring-container');
      if (!container) return;

      const frame2 = container.querySelector('.frame2');
      const frame = container.querySelector('.frame');
      const line1 = container.querySelector('.line1');
      const line2 = container.querySelector('.line2');
      const frame3 = container.querySelector('.frame3');

      if (frame2) {
        frame2.style.transform = `rotate(${this.pendulum1.angle}rad)`;
      }
      if (frame) {
        frame.style.transform = `rotate(${this.pendulum2.angle}rad)`;
      }
      if (line1) {
        line1.style.transform = `rotate(${this.pendulum1.angle}rad)`;
      }
      if (line2) {
        line2.style.transform = `rotate(${this.pendulum1.angle * 0.6}rad)`;
      }
      if (frame3) {
        frame3.style.transform = `rotate(${this.pendulum1.angle}rad)`;
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
      this.pendulum1 = { angle: 0, velocity: 0, damping: 0.98 };
      this.pendulum2 = { angle: 0, velocity: 0, damping: 0.95 };
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
        const direction = deltaX > 0 ? 1 : -1;
        
        // 计算风力
        const windForce = Math.min(speed * 0.1, 0.05);
        
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
      const resetAnimation = () => {
        this.physics.pendulum1.velocity *= 0.9;
        this.physics.pendulum2.velocity *= 0.9;
        this.physics.pendulum1.angle *= 0.95;
        this.physics.pendulum2.angle *= 0.95;
        
        this.physics.applyTransforms();
        
        if (Math.abs(this.physics.pendulum1.angle) > 0.001 || 
            Math.abs(this.physics.pendulum2.angle) > 0.001) {
          requestAnimationFrame(resetAnimation);
        } else {
          this.physics.reset();
        }
      };
      
      resetAnimation();
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