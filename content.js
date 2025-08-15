/**
 * 赛博风铃 Chrome 插件 - Content Script
 * 在网页右上角注入可交互的风铃组件
 */

// 防止重复注入
if (!window.cyberWindChimeInjected) {
  window.cyberWindChimeInjected = true;

  /**
   * 创建风铃组件的HTML结构
   * @returns {HTMLElement} 风铃容器元素
   */
  function createWindChime() {
    const container = document.createElement('div');
    container.id = 'cyber-wind-chime';
    container.className = 'cyber-ring';
    
    container.innerHTML = `
      <div class="line2"></div>
      <p class="no">no</p>
      <div class="auto-wrapper">
        <div class="group1">
          <div class="group4">
            <div class="rectangle1">
              <p class="text">
                叮<br />鈴
              </p>
            </div>
          </div>
          <div class="line1"></div>
        </div>
        <div class="group5">
          <div class="union">
            <p class="text2">风有在吹吗？</p>
          </div>
          <p class="yes">yes</p>
        </div>
      </div>
    `;
    
    return container;
  }

  /**
   * 计算鼠标移动速度
   * @param {number} deltaX X轴移动距离
   * @param {number} deltaY Y轴移动距离
   * @param {number} deltaTime 时间间隔
   * @returns {number} 移动速度
   */
  function calculateMouseSpeed(deltaX, deltaY, deltaTime) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return deltaTime > 0 ? distance / deltaTime : 0;
  }

  /**
   * 应用摇摆动画
   * @param {HTMLElement} element 要摇摆的元素
   * @param {number} intensity 摇摆强度
   */
  function applySwingAnimation(element, intensity) {
    const maxRotation = Math.min(intensity * 0.5, 30); // 最大旋转角度30度
    const rotation = (Math.random() - 0.5) * maxRotation;
    
    element.style.transform = `rotate(${rotation}deg)`;
    element.style.transition = 'transform 0.3s ease-out';
  }

  /**
   * 重置风铃到静止状态
   * @param {HTMLElement} element