import { View } from 'react-native';
import React from 'react';
import SkeletonLoader from 'expo-skeleton-loader';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';

const NativeUiCardSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonLoader style={styles.topContainer}>
        <SkeletonLoader.Item style={styles.img} />
        <SkeletonLoader.Item style={styles.content}>
          <SkeletonLoader.Item style={styles.elem} />
          <SkeletonLoader.Item style={styles.secondItem} />
          <SkeletonLoader.Container style={styles.creatorContent}>
            <SkeletonLoader.Item style={styles.avater} />
            <SkeletonLoader.Container>
              <SkeletonLoader.Item style={styles.name} />
              <SkeletonLoader.Item style={styles.role} />
            </SkeletonLoader.Container>
          </SkeletonLoader.Container>
          <SkeletonLoader.Container
            style={[DefaultStyles.containerSpaced, styles.lastElemContainer]}
          >
            <SkeletonLoader.Container style={DefaultStyles.containerRow}>
              <SkeletonLoader.Item style={styles.views} />
              <SkeletonLoader.Item style={styles.coments} />
            </SkeletonLoader.Container>
            <SkeletonLoader.Item style={styles.coments} />
          </SkeletonLoader.Container>
        </SkeletonLoader.Item>
      </SkeletonLoader>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },

  topContainer: {
    marginVertical: 10,
  },

  img: {
    width: THEME.WIDTH * 0.9,
    height: 188,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },

  content: {
    height: 188,
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 14,
    width: THEME.WIDTH * 0.9,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  elem: {
    width: THEME.WIDTH * 0.4,
    height: 20,
  },

  secondItem: {
    width: THEME.WIDTH * 0.8,
    height: 20,
    marginTop: 12,
  },

  creatorContent: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  avater: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 20,
    marginTop: 12,
  },

  name: {
    width: THEME.WIDTH * 0.2,
    height: 12,
    marginTop: 22,
  },

  role: {
    width: THEME.WIDTH * 0.2,
    height: 12,
    marginTop: 8,
  },

  views: {
    width: 20,
    height: 20,
    borderRadius: 18,

    paddingRight: 12,
  },

  coments: {
    marginLeft: 10,
    width: 20,
    height: 20,
    borderRadius: 18,
  },

  lastElemContainer: {
    marginLeft: 70,
  },
};
export default NativeUiCardSkeleton;
