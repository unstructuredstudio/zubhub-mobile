import { View, Text, Image } from 'react-native';
import React from 'react';

const Avatar = ({ uri, width, height, radius }) => {
  return (
    <View
      style={{
        width: width ? width : 50,
        height: height ? height : 50,
      }}
    >
      <Image
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius ? radius : 50,
        }}
        source={uri}
      />
    </View>
  );
};

export default Avatar;
