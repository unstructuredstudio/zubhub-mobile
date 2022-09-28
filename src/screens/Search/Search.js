import {
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useState } from 'react';
import { NativeUiText, NativeUiHeader } from '@components/';
import styles from './Search.style';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { Entypo, AntDesign } from 'react-native-vector-icons';
import { autocompleteProjects } from '../../ApiCall/api';
import { COLORS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const Search = () => {
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [inputText, setInputText] = useState('');

  const { t } = useTranslation();

  const navigation = useNavigation();

  const getAutoCompleteList = (query) => {
    let result = autocompleteProjects(query);
    result.then((res) => setAutocompleteList(res));
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      <View style={styles.list}>
        <View style={DefaultStyles.containerSpaced}>
          <View style={[styles.searchContainer, styles.inputContainer]}>
            <AntDesign
              style={styles.icon}
              name="search1"
              size={20}
              color={THEME.COLORS.SECONDARY_TEXT}
            />
            <TextInput
              value={inputText}
              onChangeText={(e) => {
                setInputText(e);
                getAutoCompleteList(e);
              }}
              style={styles.input}
              placeholder={t('searchScreen.search')}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setInputText('');
              setAutocompleteList([]);
            }}
            activeOpacity={0.7}
            style={styles.searchBox}
          >
            <Entypo
              style={styles.icon}
              name="cross"
              size={26}
              color={THEME.COLORS.WHITE}
            />
          </TouchableOpacity>
        </View>

        <View>
          {autocompleteList.length > 0 ? (
            <View>
              {autocompleteList?.map((res) => (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ProjectDetail', { item: res })
                  }
                  style={[DefaultStyles.containerSpaced, styles.mainContainer]}
                >
                  <View style={DefaultStyles.containerRow}>
                    <AntDesign
                      style={styles.icon}
                      name="search1"
                      size={15}
                      color={THEME.COLORS.SECONDARY_TEXT}
                    />
                    <NativeUiText fontSize={16} textType={'bold'}>
                      {res?.title}
                    </NativeUiText>
                    <NativeUiText
                      fontSize={12}
                      textColor={COLORS.SECONDARY_TEXT}
                    >
                      {'  '} {res?.creator?.username}{' '}
                    </NativeUiText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View>
              <Image
                resizeMode="contain"
                style={styles.notFoundImage}
                source={require('@asset/notfound.png')}
              />
              <NativeUiText
                textColor={COLORS.SECONDARY_TEXT}
                style={styles.txt}
                fontSize={18}
              >
                {t('searchScreen.default')}
              </NativeUiText>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Search;
