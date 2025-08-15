import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.cyberRing}>
      <div className={styles.line2} />
      <p className={styles.no}>no</p>
      <div className={styles.autoWrapper}>
        <div className={styles.group1}>
          <div className={styles.group4}>
            <div className={styles.rectangle1}>
              <p className={styles.text}>
                叮<br />鈴
              </p>
            </div>
          </div>
          <div className={styles.line1} />
        </div>
        <div className={styles.group5}>
          <div className={styles.union}>
            <p className={styles.text2}>风有在吹吗？</p>
          </div>
          <p className={styles.yes}>yes</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
