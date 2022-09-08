import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  main: {
    marginVertical: 20,
    marginHorizontal: 16,
  },

  list: {
    marginTop: 17,
  },

  title: {
    marginVertical: 20,
    marginHorizontal: 16,
  },

  userDetails: {
    marginHorizontal: 7,
  },

  txt: {
    marginTop: 3,
  },

  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 28,
  },

  card: {
    width: THEME.WIDTH / 2.5,
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    marginRight: 16,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 20,
  },

  aboutSection: {
    marginTop: 28,
  },

  aboutText: {
    marginTop: 14,
  },

  avaterContainer: {
    width: 45,
    height: 45,
  },

  avater: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: THEME.COLORS.WHITE,
  },

  commentBox: {
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    borderRadius: 7,
    marginTop: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  input: {
    paddingVertical: 12,
    height: 124,
    // flex: 1,
  },

  commentCard: {
    marginTop: 22,
  },

  comments: {
    marginBottom: 21,
  },
});

export default styles;
