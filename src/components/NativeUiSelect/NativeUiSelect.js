// import React from 'react';
// import { View, StyleSheet } from 'react-native';
// import DefaultStyles from '../../constants/DefaultStyles.style';
// import * as THEME from '../../constants/theme';
// import { Entypo } from '@expo/vector-icons';
// import RNPickerSelect, { defaultStyles } from 'react-native-picker-select';

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 15,
//     height: 55,
//     borderRadius: 10,
//     backgroundColor: THEME.COLORS.WHITE,
//     shadowColor: '#ccc',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 2.22,
//     elevation: 3,
//     borderWidth: 2,
//     borderColor: '#eee',
//     fontWeight: 'bold',
//     color: THEME.BLACK,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
// });

// const NativeUiSelect = ({ item, onValueChange }) => {
//   const [selectedLanguage, setSelectedLanguage] = React.useState();

//   return (
//     <View>
//       <View>
//         <View
//           style={
//             {
//               // backgroundColor: 'blue',
//             }
//           }
//         >
//           <RNPickerSelect
//             items={[
//               {
//                 label: 'Football',
//                 value: 'football',
//               },
//               {
//                 label: 'Baseball',
//                 value: 'baseball',
//               },
//               {
//                 label: 'Hockey',
//                 value: 'hockey',
//               },
//             ]}
//             // onValueChange={(value) => {
//             //   this.setState({
//             //     favSport0: value,
//             //   });
//             // }}
//             // onUpArrow={() => {
//             //   this.inputRefs.firstTextInput.focus();
//             // }}
//             // onDownArrow={() => {
//             //   this.inputRefs.favSport1.togglePicker();
//             // }}
//             // style={pickerSelectStyles}
//             // value={this.state.favSport0}
//             // ref={(el) => {
//             //   this.inputRefs.favSport0 = el;
//             // }}
//           />
//         </View>
//         <View style={styles.iconContainer}>
//           <Entypo name="chevron-down" size={24} color="black" />
//         </View>
//       </View>
//     </View>
//   );
// };

// export default NativeUiSelect;
import { View, Text } from 'react-native';
import React from 'react';

const NativeUiSelect = () => {
  return (
    <View>
      <Text>NativeUiSelect</Text>
    </View>
  );
};

export default NativeUiSelect;
