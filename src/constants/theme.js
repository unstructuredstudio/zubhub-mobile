import { Dimensions } from 'react-native';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  PRIMARY_RED: '#DC3545',
  PRIMARY_YELLOW: '#FDCB00',
  PRIMARY_TEAL: '#00B8C4',
  PRIMARY_BLUE: '#8EBDFF',
  PRIMARY_GREEN: '#7BBF6A',
  PRIMARY_TEXT: '#212121',
  PRIMARY_GREY: '#E4E4E4',
  SECONDARY_TEXT: '#757575',
  SECONDARY_GREY: '#E4E4E4',
  PRIMARY_ERROR_CARD: 'rgba(250, 186, 186, 0.2)',
};

const FONT_SIZE = {
  EXTRA_LARGE: 30,
  LARGE: 22,
  MEDIUM: 18,
  NORMAL: 14,
  SMALL: 12,
};

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

export { COLORS, FONT_SIZE, WIDTH, HEIGHT };
