import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  commentBox: {
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    borderRadius: 7,
    marginTop: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  input: {
    paddingVertical: 12,
  },
  commentCard: {
    marginTop: 22,
  },
});

export default styles;
