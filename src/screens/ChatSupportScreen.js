import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {BackIcon} from '../components/Icons';
import {findOrderById, statusLabels} from '../data/orders';

// ─── Conversation state machine ───────────────────────────────────────────────
// null          = normal chat
// 'AWAIT_ORDER' = Sara asked for an order number, waiting for user to type it
let conversationState = null;

const buildOrderReply = order => {
  const statusEmoji = {
    delivered: '✅',
    processing: '⏳',
    shipped: '🚚',
    cancelled: '❌',
  };

  const emoji = statusEmoji[order.status] || '📦';
  const statusLabel = statusLabels[order.status];

  // Find the current (most recent active) timeline step
  const currentStep =
    [...order.timeline].reverse().find(s => s.completed) || order.timeline[0];

  const itemList = order.items
    .map(i => `  • ${i.name} (x${i.qty})`)
    .join('\n');

  if (order.status === 'cancelled') {
    return (
      `ትእዛዝ #${order.id} — ${statusLabel}\n\n` +
      `❌ ኣዝናነ! እዚ ትእዛዝ ተሰሪዙ ኣሎ።\n\n` +
      `📅 ዕለት: ${order.date}\n` +
      `💰 ጠቕላላ: ${order.total}\n\n` +
      `ዝያዳ ሓገዝ ወይ ካሕሳ ምስ ደሊኻ support@azmarino.com ጸሓፈልና።`
    );
  }

  return (
    `ትእዛዝ #${order.id} — ${emoji} ${statusLabel}\n\n` +
    `📍 ሕጂ ኣበይ ኣሎ:\n   ${order.currentLocation}\n\n` +
    `🕐 ናይ ምብጻሕ ግምት: ${order.estimatedDelivery}\n` +
    `💰 ጠቕላላ: ${order.total}\n\n` +
    `🛍️ ፍርያት:\n${itemList}\n\n` +
    `📋 ናይ ትእዛዝ ፍሰት:\n   ${currentStep.status}` +
    (currentStep.date !== 'ይጽበ...' ? ` — ${currentStep.date}` : '') +
    `\n\nካልእ ሕቶ ኣሎካ ድዩ? 😊`
  );
};

// ─── Main reply logic ──────────────────────────────────────────────────────────
const getSmartReply = (userMessage, setState) => {
  const msg = userMessage.trim();
  const lower = msg.toLowerCase();

  // ── 1. If we're waiting for an order number ────────────────────────────────
  if (conversationState === 'AWAIT_ORDER') {
    conversationState = null; // reset regardless of outcome

    // Extract anything that looks like AZM + digits, or just digits
    const azmMatch = msg.toUpperCase().match(/AZM\d+/);
    const numMatch = msg.match(/\d{5,}/);
    const orderId = azmMatch
      ? azmMatch[0]
      : numMatch
      ? `AZM${numMatch[0]}`
      : msg.toUpperCase().replace(/\s/g, '');

    const order = findOrderById(orderId);

    if (order) {
      return buildOrderReply(order);
    } else {
      return (
        `😔 ትእዛዝ #${orderId} ኣይተረኽበን።\n\n` +
        `ኣረጋጊጽካ ትኽክለኛ ቁጽሪ ኣእቱ (ኣብነት: AZM104823).\n\n` +
        `ቁጽርካ ካበይ ትረኽቦ?\n` +
        `• ኣብ ናይ ትእዛዝ ታሪኽ ስክሪን\n` +
        `• ኣብ ናይ ኢመይልካ ናይ ምድጋፍ መልእኽቲ\n\n` +
        `ደጊምካ ኣብዚ ትእዛዝ ቁጽርካ ጸሓፍ!`
      );
    }
  }

  // ── 2. Order tracking intent ───────────────────────────────────────────────
  const trackingTriggers = [
    'ትእዛዘይ', 'ትእዛዝ', 'order', 'ኣበይ ኣሎ', 'where is', 'track',
    'ክትትል', 'ምክታል', 'ምስ', 'delivery', 'shipped', 'package',
  ];
  const hasTrackingIntent = trackingTriggers.some(t => lower.includes(t.toLowerCase()));

  // If they already typed an AZM number in the same message, look it up directly
  const inlineAzm = msg.toUpperCase().match(/AZM\d+/);
  if (inlineAzm && hasTrackingIntent) {
    const order = findOrderById(inlineAzm[0]);
    if (order) return buildOrderReply(order);
  }

  if (hasTrackingIntent) {
    conversationState = 'AWAIT_ORDER';
    return (
      '📦 ትእዛዝካ ክፈልጥ ፍቐደለይ!\n\n' +
      'ናይ ትእዛዝ ቁጽርኻ ኣካፍለኒ — AZM ብዝጅምር ቁጽሪ እዩ።\n\n' +
      '(ኣብነት: AZM104823)\n\n' +
      'ኣበይ ትረኽቦ? ናይ ትእዛዝ ታሪኽ ስክሪን ወይ ኢመይልካ ርአ! 📧'
    );
  }

  // ── 3. Direct AZM number with no other context ─────────────────────────────
  if (inlineAzm) {
    const order = findOrderById(inlineAzm[0]);
    if (order) return buildOrderReply(order);
    return (
      `😔 ትእዛዝ #${inlineAzm[0]} ኣይተረኽበን። ቁጽሪ ኣረጋጊጽካ ደጊምካ ጽሓፍ!`
    );
  }

  // ── 4. All other existing intents ─────────────────────────────────────────
  if (lower.match(/^(ሰላም|ሃሎ|hi|hello|hey)/i)) {
    return 'ሰላም! 😊 ኣነ ሳራ እየ። ትእዛዝካ ከናዲ ወይ ካልእ ሕቶ ምስ ሃለወካ ንገረኒ!';
  }

  if (lower.includes('ምምላስ') || lower.includes('refund')) {
    return 'ምምላስ ቀሊል እዩ! 📦 ካብ ዝተቐበልካዮ 30 መዓልታት ውሽጢ ክትመልሶ ትኽእል። ፍርያት ኣብ ምበጋግስ ምስ ኦሪጅናል መሸፈኒ ክኸውን ኣለዎ። ገንዘብካ ብ 5-7 መዓልታት ይምለሰልካ።';
  }

  if (lower.includes('ክፍሊት') || lower.includes('payment')) {
    return 'እዞም ናይ ክፍሊት ዓይነታት ንቕበል: 💳\n• Credit/Debit Cards (Visa, Mastercard)\n• PayPal\n• Bank Transfer\n\nኩሉ ክፍሊት 100% ውሕስ እዩ! 🔒';
  }

  if (lower.includes('ምልኣኽ') || lower.includes('shipping')) {
    return 'ምልኣኽ ብናጻ! 🚚 ብሓፈሻ 3-5 ናይ ስራሕ መዓልታት ይወስድ። ናብ ኣውሮጳ 2-3 መዓልታት።';
  }

  if (lower.includes('ቅናሽ') || lower.includes('discount')) {
    return 'ፍሉይ ቅናሽ! 🎉\n• ሓድሽ ደሞዝ: 15% ቅናሽ ኣብ መጀመርታ ትእዛዝ\n• ክሳብ 70% flash sales\n• ነጻ ምልኣኽ ኣብ ኩሉ ትእዛዝ';
  }

  if (lower.includes('ጽሬት') || lower.includes('quality')) {
    return 'ኩሉ ፍርያትና 100% ኦሪጅናል እዩ! ✨ ቅድሚ ምልኣኽ ኩሉ ፍርያት ይምርመር።';
  }

  if (lower.match(/የቐንየ|ጽቡቕ|thanks|thank/i)) {
    return 'ብሓጎስ! 😊 ካልእ እንተድሊካ ንገረለይ። ሓጎስ ዓሚልና ኣገልግሎትና እዩ! 🌟';
  }

  if (lower.match(/ኣይሰርሕን|ጸገም|problem|issue|broken/i)) {
    return 'ይቕሬታ! 😔 ጸገምካ ብዝርዝር ንገረኒ ወይ support@azmarino.com ጸሓፈልና። ኣብ 24 ሰዓት ክንምልሰልካ ኢና።';
  }

  return 'ጽቡቕ ሕቶ! 🤔 ዝያዳ ክሕግዘካ support@azmarino.com ክትጽሕፈልና ትኽእል። ወይ ሕቶኻ ብካልእ መንገዲ ንገረለይ! 👇';
};

// ──────────────────────────────────────────────────────────────────────────────

const ChatSupportScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [chatState, setChatState] = useState(null); // mirrors conversationState for re-render
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'ሰላም! ኣነ ሳራ እየ፡ ናይ ኣዝማሪኖ ደገፍ ኣማኻሪት። 😊\n\nትእዛዝካ ኣበይ ኣሎ? ወይ ካልእ ሕቶ ምስ ሃለወካ ንገረኒ!',
      isBot: true,
      time: 'ሕጂ',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  const msgId = useRef(2);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages, isTyping]);

  // Reset module-level state when screen mounts
  useEffect(() => {
    conversationState = null;
    setChatState(null);
  }, []);

  const sendMessage = (text) => {
    const msgText = (text || message).trim();
    if (!msgText) return;

    const userMsg = {
      id: msgId.current++,
      text: msgText,
      isBot: false,
      time: 'ሕጂ',
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsTyping(true);

    const reply = getSmartReply(msgText, setChatState);
    setChatState(conversationState); // sync local state for UI hints

    const typingDelay = Math.min(2200, 900 + reply.length * 8);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {id: msgId.current++, text: reply, isBot: true, time: 'ሕጂ'},
      ]);
    }, typingDelay);
  };

  const quickReplies = [
    {label: '📦 ትእዛዘይ ኣበይ ኣሎ?', msg: 'ትእዛዘይ ኣበይ ኣሎ?'},
    {label: '↩️ ምምላስ', msg: 'ምምላስ ከመይ ይካየድ?'},
    {label: '💳 ክፍሊት', msg: 'ናይ ክፍሊት ኣገባባት እንታይ እዩ?'},
    {label: '🚚 ምልኣኽ', msg: 'ምልኣኽ ክንደይ ይወስድ?'},
    {label: '🎁 ቅናሽ', msg: 'ቅናሽ ኣሎ ድዩ?'},
  ];

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {/* Header */}
        <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {/* Avatar dot */}
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>ሳ</Text>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={[styles.headerTitle, {color: theme.text}]}>ሳራ — ደገፍ ኣማኻሪት</Text>
              <Text style={[styles.headerSubtitle, {color: isTyping ? '#27ae60' : theme.subText}]}>
                {isTyping ? '✍️ ትጽሕፍ ኣላ...' : '🟢 ኦንላይን ኣሎ • 24/7'}
              </Text>
            </View>
          </View>
          <View style={{width: 28}} />
        </View>

        {/* Waiting-for-order-number hint banner */}
        {chatState === 'AWAIT_ORDER' && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>
              📦 ናይ ትእዛዝ ቁጽርካ ኣካፍሊ — ኣብነት: AZM104823
            </Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({animated: true})
          }>
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isBot
                  ? [styles.botBubble, {backgroundColor: theme.cardBg}]
                  : styles.userBubble,
              ]}>
              {msg.isBot && (
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>ሳ</Text>
                </View>
              )}
              <View style={[styles.bubbleContent, msg.isBot ? styles.botContent : styles.userContent]}>
                <Text
                  style={[
                    styles.messageText,
                    {color: msg.isBot ? theme.text : '#fff'},
                  ]}>
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    {color: msg.isBot ? theme.subText : 'rgba(255,255,255,0.65)'},
                  ]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>ሳ</Text>
              </View>
              <View style={[styles.bubbleContent, styles.botContent, {backgroundColor: theme.cardBg}]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, {backgroundColor: theme.subText}]} />
                  <View style={[styles.dot, {backgroundColor: theme.subText}]} />
                  <View style={[styles.dot, {backgroundColor: theme.subText}]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick replies */}
        <View style={[styles.quickBar, {backgroundColor: theme.cardBg, borderTopColor: theme.border}]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 12, gap: 8}}>
            {quickReplies.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickBtn, {borderColor: theme.border}]}
                onPress={() => sendMessage(q.msg)}>
                <Text style={[styles.quickBtnText, {color: theme.text}]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.cardBg,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + 10,
            },
          ]}>
          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: chatState === 'AWAIT_ORDER' ? '#FF0000' : theme.border}]}
            placeholder={
              chatState === 'AWAIT_ORDER'
                ? 'ናይ ትእዛዝ ቁጽርካ ጸሓፍ (AZM...)...'
                : 'መልእኽትኻ ጸሓፍ...'
            }
            placeholderTextColor={chatState === 'AWAIT_ORDER' ? '#FF0000' : theme.subText}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={() => sendMessage()}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!message.trim()}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27ae60',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {fontSize: 16, fontWeight: 'bold'},
  headerSubtitle: {fontSize: 12, marginTop: 1},
  hintBanner: {
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hintText: {
    color: '#FF0000',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {flex: 1},
  messagesContent: {padding: 14, paddingBottom: 20},
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  botBubble: {alignSelf: 'flex-start'},
  userBubble: {alignSelf: 'flex-end', flexDirection: 'row-reverse'},
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
    flexShrink: 0,
  },
  botAvatarText: {color: '#fff', fontWeight: 'bold', fontSize: 12},
  bubbleContent: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  botContent: {
    borderBottomLeftRadius: 4,
  },
  userContent: {
    backgroundColor: '#FF0000',
    borderBottomRightRadius: 4,
  },
  messageText: {fontSize: 15, lineHeight: 22, marginBottom: 4},
  messageTime: {fontSize: 11, alignSelf: 'flex-end'},
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  quickBar: {
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickBtnText: {fontSize: 13, fontWeight: '600'},
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    borderWidth: 1.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {opacity: 0.4},
  sendBtnText: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
});

export default ChatSupportScreen;
