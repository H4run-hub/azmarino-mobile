import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

// All icons using Ionicons - Professional & Clean

export const SearchIcon = ({size = 20, color = '#666'}) => (
  <Icon name="search-outline" size={size} color={color} />
);

export const CameraIcon = ({size = 22, color = '#FF0000'}) => (
  <Icon name="camera-outline" size={size} color={color} />
);

export const CartIcon = ({size = 22, color = '#FF0000'}) => (
  <Icon name="cart-outline" size={size} color={color} />
);

export const UserIcon = ({size = 22, color = '#FF0000'}) => (
  <Icon name="person-outline" size={size} color={color} />
);

export const SunIcon = ({size = 22, color = '#FF0000'}) => (
  <Icon name="sunny-outline" size={size} color={color} />
);

export const MoonIcon = ({size = 22, color = '#FF0000'}) => (
  <Icon name="moon-outline" size={size} color={color} />
);

export const StarIcon = ({size = 14, color = '#FFD700', filled = true}) => (
  <Icon name={filled ? 'star' : 'star-outline'} size={size} color={color} />
);

export const HeartIcon = ({size = 20, color = '#FF0000', filled = false}) => (
  <Icon name={filled ? 'heart' : 'heart-outline'} size={size} color={color} />
);

export const BackIcon = ({size = 28, color = '#fff'}) => (
  <Icon name="chevron-back" size={size} color={color} />
);

export const CloseIcon = ({size = 24, color = '#666'}) => (
  <Icon name="close" size={size} color={color} />
);

export const FilterIcon = ({size = 20, color = '#666'}) => (
  <Icon name="options-outline" size={size} color={color} />
);

export const LocationIcon = ({size = 18, color = '#FF0000'}) => (
  <Icon name="location-outline" size={size} color={color} />
);

export const TruckIcon = ({size = 18, color = '#666'}) => (
  <Icon name="car-outline" size={size} color={color} />
);

export const CheckIcon = ({size = 16, color = '#27ae60'}) => (
  <Icon name="checkmark" size={size} color={color} />
);

export const PlusIcon = ({size = 20, color = '#fff'}) => (
  <Icon name="add" size={size} color={color} />
);

export const MinusIcon = ({size = 20, color = '#fff'}) => (
  <Icon name="remove" size={size} color={color} />
);

// Additional useful icons you might need
export const HomeIcon = ({size = 24, color = '#666'}) => (
  <Icon name="home-outline" size={size} color={color} />
);

export const SettingsIcon = ({size = 24, color = '#666'}) => (
  <Icon name="settings-outline" size={size} color={color} />
);

export const NotificationIcon = ({size = 24, color = '#666'}) => (
  <Icon name="notifications-outline" size={size} color={color} />
);

export const ChatIcon = ({size = 24, color = '#666'}) => (
  <Icon name="chatbubble-outline" size={size} color={color} />
);

export const TrackIcon = ({size = 24, color = '#666'}) => (
  <Icon name="navigate-outline" size={size} color={color} />
);

export const LogoutIcon = ({size = 24, color = '#666'}) => (
  <Icon name="log-out-outline" size={size} color={color} />
);

export const EditIcon = ({size = 24, color = '#666'}) => (
  <Icon name="create-outline" size={size} color={color} />
);

export const ShareIcon = ({size = 24, color = '#666'}) => (
  <Icon name="share-social-outline" size={size} color={color} />
);

export const ChevronRightIcon = ({size = 20, color = '#666', rotated = false}) => (
  <Icon
    name={rotated ? 'chevron-down' : 'chevron-forward'}
    size={size}
    color={color}
  />
);

export const OrderIcon = ({size = 24, color = '#666'}) => (
  <Icon name="receipt-outline" size={size} color={color} />
);

export const ShieldIcon = ({size = 24, color = '#666'}) => (
  <Icon name="shield-checkmark-outline" size={size} color={color} />
);

export const InfoIcon = ({size = 24, color = '#666'}) => (
  <Icon name="information-circle-outline" size={size} color={color} />
);

export const GearIcon = ({size = 24, color = '#666'}) => (
  <Icon name="settings-outline" size={size} color={color} />
);

export const BellIcon = ({size = 24, color = '#666', filled = false}) => (
  <Icon name={filled ? 'notifications' : 'notifications-outline'} size={size} color={color} />
);

export const TrashIcon = ({size = 24, color = '#666'}) => (
  <Icon name="trash-outline" size={size} color={color} />
);

export const WalletIcon = ({size = 24, color = '#666'}) => (
  <Icon name="wallet-outline" size={size} color={color} />
);
