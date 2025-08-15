import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.cyberRing}>
      <div className={styles.frame}>
        <div className={styles.group4}>
          <div className={styles.rectangle1}>
            <p className={styles.text}>
              叮<br />鈴
            </p>
          </div>
        </div>
        <div className={styles.line22}>
          <div className={styles.line2} />
          <p className={styles.yes}>yes</p>
        </div>
      </div>
      <div className={styles.frame2}>
        <div className={styles.union}>
          <p className={styles.text2}>风有在吹吗？</p>
        </div>
      </div>
      <div className={styles.frame3}>
        <div className={styles.line1} />
        <p className={styles.yes}>no</p>
      </div>
    </div>
  );
}

export default Component;
