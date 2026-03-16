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
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {s, vs, fs} from '../utils/scale';

// ─── Conversation state machine ───────────────────────────────────────────────
let conversationState = null;
// Track last few topics so Sara can give varied follow-ups
let recentTopics = [];

const pushTopic = (topic) => {
  recentTopics.push(topic);
  if (recentTopics.length > 5) recentTopics.shift();
};

// ─── Latin-alphabet Tigrinya normalizer ───────────────────────────────────────
const normalizeLatin = (text) => {
  let s = text.toLowerCase().replace(/[!?.,;:'"]/g, '').trim();
  s = s.replace(/qu/g, 'k').replace(/ph/g, 'f').replace(/ch/g, 'ch');
  s = s.replace(/sh/g, 'sh').replace(/ts/g, 'ts').replace(/gh/g, 'g');
  s = s.replace(/aa/g, 'a').replace(/ee/g, 'e').replace(/oo/g, 'o');
  s = s.replace(/ii/g, 'i').replace(/uu/g, 'u');
  return s;
};

// ─── Script detection ─────────────────────────────────────────────────────────
// Detects if input is Ge'ez script, Latin-Tigrinya, or English
// Returns: 'geez' | 'latin_ti' | 'en'
const GEEZ_RANGE = /[\u1200-\u137F]/; // Ethiopic Unicode block
const LATIN_TI_KEYWORDS = [
  'selam', 'salam', 'kemey', 'dehan', 'yeqenyeley', 'yekenyeley',
  'tsbuq', 'tsbuk', 'iye', 'iyye', 'iyu', 'aleka', 'aleki',
  'entay', 'keman', 'haftey', 'habtey', 'abey', 'kittel',
  'tezaz', 'teezaz', 'kiflit', 'keflit', 'milak', 'melaek',
  'diskawnt', 'diskaunt', 'fereyat', 'kidan', 'chama', 'santa',
  'tsegem', 'ayserhhin', 'deliye', 'yideli', 'fetiye',
  'dehankuni', 'dehankun', 'megase', 'akawnt', 'paswerd',
  'orjinal', 'tsret', 'himagq', 'kurfit', 'aken', 'hibri', 'sayz',
  'ngereni', 'habtam', 'memelasi', 'temelas', 'kahsa',
];

const detectScript = (text) => {
  // If any Ge'ez characters → Ge'ez
  if (GEEZ_RANGE.test(text)) return 'geez';

  // Check if it contains Latin-Tigrinya keywords
  const lower = text.toLowerCase().replace(/[!?.,;:'"]/g, '').trim();
  const words = lower.split(/\s+/);
  const latinTiMatches = words.filter(w => LATIN_TI_KEYWORDS.includes(w)).length;

  // If 1+ Tigrinya words found, or certain patterns match
  if (latinTiMatches >= 1) return 'latin_ti';

  // Check for common Latin-Tigrinya greeting/phrase patterns
  if (/^(selam|salam|kemey|dehan)/i.test(lower)) return 'latin_ti';

  return 'en';
};

// ─── Intent detection helpers ─────────────────────────────────────────────────
const matchesAny = (text, patterns) =>
  patterns.some(p => typeof p === 'string' ? text.includes(p) : p.test(text));

// Greeting patterns (Ge'ez + Latin + English)
const GREETING_PATTERNS = [
  'ሰላም', 'ሃሎ', 'ከመይ',
  /^(hi+|hello+|hey+|hola|yo)\b/i,
  /^selam/i, /^salam/i, /^salaam/i,
  /^dehando/i, /^dehan\b/i,
  /^merhaba/i, /^shalom/i,
];

// "How are you" patterns
const HOW_ARE_YOU_PATTERNS = [
  'how are you', 'how r u', 'howdy', "how's it going",
  'kemey aleka', 'kemey aleki', 'kemey alekum', 'kemey aleyti',
  'kemey alo', 'kemey ala', 'kemey do', 'kemey haleuka',
  'kemey haleki', 'kemey weilka', 'kemey weilki',
  'ከመይ ኣለኻ', 'ከመይ ኣለኺ', 'ከመይ ኣለኹም', 'ከመይ ኣሎ',
  'ከመይ ውዒልካ', 'ከመይ ውዒልኪ',
];

// "I'm fine" patterns
const FINE_PATTERNS = [
  'fine', "i'm good", 'im good', 'doing well', 'great', 'not bad', 'all good',
  'dehan', 'dehan eye', 'dehan iyu', 'dehan iyye', 'dehan iye',
  'tsbuq', 'tsbuk', 'nay grmma',
  'ደሓን', 'ደሓን እየ', 'ጽቡቕ', 'ጽቡቕ እየ',
];

// Thank you patterns
const THANKS_PATTERNS = [
  'thanks', 'thank you', 'thx', 'ty', 'appreciate', 'cheers',
  'yeqenyeley', 'yekenyeley', 'yekenyelka', 'megase',
  'የቐንየለይ', 'የቐንየልካ', 'የቐንየልኪ', 'መጋሰ', 'ጽቡቕ',
];

// Order/tracking patterns
const ORDER_PATTERNS = [
  'ትእዛዘይ', 'ትእዛዝ', 'order', 'ኣበይ ኣሎ', 'where is', 'track',
  'ክትትል', 'ምክትታል', 'delivery status', 'shipped', 'package',
  'tezaz', 'teezaz', 'teezazey', 'abey alo', 'kittel',
  'my order', 'order status', 'ናይ ትእዛዝ',
];

// Return/refund patterns
const RETURN_PATTERNS = [
  'ምምላስ', 'ተመላሲ', 'refund', 'return', 'send back', 'money back',
  'memlasi', 'temelas', 'kahsa',
  'ካሕሳ', 'ገንዘበይ', 'ክመልሶ',
];

// Payment patterns
const PAYMENT_PATTERNS = [
  'ክፍሊት', 'ናይ ክፍሊት', 'payment', 'pay', 'card', 'visa', 'mastercard',
  'credit card', 'debit card', 'bank', 'transfer', 'paypal', 'stripe',
  'kiflit', 'kefilit', 'keflit',
];

// Shipping/delivery patterns
const SHIPPING_PATTERNS = [
  'ምልኣኽ', 'ደሊቨሪ', 'shipping', 'delivery', 'deliver', 'ship', 'send',
  'how long', 'ክንደይ ይወስድ', 'when will', 'arrive',
  'milak', 'melaek', 'delivery', 'kinidey yewesid',
];

// Discount patterns
const DISCOUNT_PATTERNS = [
  'ዲስካውንት', 'discount', 'sale', 'offer', 'promo', 'coupon', 'code',
  'flash sale', 'deal', 'cheaper', 'nak zehagose',
  'diskawnt', 'diskaunt',
];

// Product/shopping patterns
const PRODUCT_PATTERNS = [
  'ፍርያት', 'product', 'clothes', 'clothing', 'ክዳን', 'ጫማ', 'shoe',
  'bag', 'ሳንጣ', 'dress', 'shirt', 'pants', 'jeans', 'jacket',
  'phone', 'laptop', 'watch', 'electronics', 'ኤሌክትሮኒክስ',
  'kidan', 'chama', 'santa', 'fereyat',
  'size', 'ዓቐን', 'color', 'ሕብሪ', 'aken', 'hibri', 'sayz',
];

// Quality patterns
const QUALITY_PATTERNS = [
  'ጽሬት', 'quality', 'original', 'fake', 'real', 'genuine', 'authentic',
  'tsret', 'orjinal',
];

// Problem/complaint patterns
const PROBLEM_PATTERNS = [
  'ኣይሰርሕን', 'ጸገም', 'problem', 'issue', 'broken', 'wrong', 'damaged',
  'not working', 'error', 'bug', 'help', 'complaint', 'bad',
  'tsegem', 'ayserhhin', 'himagq',
  'ሕማቕ', 'ዝተበላሸወ', 'ጌጋ',
];

// Account patterns
const ACCOUNT_PATTERNS = [
  'account', 'password', 'login', 'register', 'sign up', 'ኣካውንት',
  'forgot password', 'change password', 'email', 'phone number',
  'akawnt', 'paswerd',
];

// Who are you / about Sara
const ABOUT_SARA_PATTERNS = [
  'who are you', 'what are you', 'are you real', 'are you human', 'are you ai',
  'are you a bot', 'your name', 'men ika', 'men iki', 'menika',
  'መን ኢኻ', 'መን ኢኺ', 'ሰብ ዲኻ', 'ሰብ ዲኺ',
];

// Goodbye patterns
const GOODBYE_PATTERNS = [
  'bye', 'goodbye', 'see you', 'later', 'ciao', 'goodnight',
  'dehankuni', 'dehankun', 'dehan kuni', 'dehan kun',
  'ደሓን ኩኒ', 'ደሓን ኩን', 'ሰናይ ለይቲ', 'ስላም',
];

// About Azmarino
const ABOUT_AZMARINO_PATTERNS = [
  'azmarino', 'ኣዝማሪኖ', 'about us', 'about you', 'your company',
  'what is azmarino', 'ent ay azmarino',
];

// ─── Varied response helpers ──────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── 3-way response helper ────────────────────────────────────────────────────
// Returns the right response based on detected script
const respond = (script, en, geez, latinTi) => {
  if (script === 'latin_ti') return latinTi;
  if (script === 'geez') return geez;
  return en;
};

// ─── Main reply logic ─────────────────────────────────────────────────────────
const getSmartReply = (userMessage, setState, lang, navigation) => {
  const msg = userMessage.trim();
  const lower = msg.toLowerCase();
  const latin = normalizeLatin(msg);
  const words = latin.split(/\s+/);

  // Detect which script the user is writing in
  const script = detectScript(msg);

  // Helper to check against pattern arrays
  const matches = (patterns) =>
    patterns.some(p => {
      if (typeof p === 'string') return lower.includes(p) || latin.includes(p.toLowerCase());
      return p.test(lower) || p.test(latin);
    });

  // ── 1. If we're waiting for an order number ──────────────────────────────
  if (conversationState === 'AWAIT_ORDER') {
    conversationState = null;

    const azmMatch = msg.toUpperCase().match(/AZM\d+/);
    const numMatch = msg.match(/\d{4,}/);
    const orderId = azmMatch
      ? azmMatch[0]
      : numMatch
      ? `AZM${numMatch[0]}`
      : null;

    if (orderId) {
      pushTopic('order');
      return respond(script,
        `Got it! Order #${orderId} 📦\n\nTo see full tracking details, please go to the "Track Order" screen from your profile.\n\nYou can also check "Order History" to see all your orders.\n\nIf something doesn't look right, email us at support@azmarino.online and we'll sort it out! 😊`,
        `ተረዲኤ! ትእዛዝ #${orderId} 📦\n\nምሉእ ናይ ክትትል ዝርዝር ንምርኣይ፡ ካብ ፕሮፋይልካ "ትእዛዝ ተኸታተል" ስክሪን ጠውቕ።\n\n"ታሪኽ ትእዛዝ" ውን ርአ ኩሎም ትእዛዛትካ ንምርኣይ።\n\nጸገም ምስ ሃለወ support@azmarino.online ጸሓፈልና ክንሕግዘካ! 😊`,
        `Teridye! Tezaz #${orderId} 📦\n\nMluE nay kittel zrzr nmray, kab profile ka "Tezaz Tekatateli" screen towiq.\n\n"Tarik Tezaz" wn rE kulom tezazatka nmray.\n\nTsegem ms halewe support@azmarino.online tshafelna knhgzeka! 😊`
      );
    }

    // Didn't get a valid order number
    return respond(script,
      `Hmm, I couldn't find an order number in your message 🤔\n\nOrder numbers start with AZM followed by digits (e.g. AZM104823).\n\nYou can find yours in:\n• Your Order History screen\n• Your confirmation email\n\nTry typing it again, or go to "Track Order" from your profile! 📋`,
      `ኣብ መልእኽትኻ ናይ ትእዛዝ ቁጽሪ ኣይረኸብኩን 🤔\n\nናይ ትእዛዝ ቁጽሪ ብ AZM ይጅምር (ኣብነት: AZM104823)።\n\nካበይ ትረኽቦ:\n• ናይ ትእዛዝ ታሪኽ ስክሪን\n• ናይ ኢመይልካ ናይ ምረጋገጺ መልእኽቲ\n\nደጊምካ ጽሓፍ ወይ "ትእዛዝ ተኸታተል" ካብ ፕሮፋይልካ ጠውቕ! 📋`,
      `Ab melEkhtka nay tezaz qutsri ayrekebkun 🤔\n\nNay tezaz qutsri b AZM yijmir (abnit: AZM104823).\n\nKabey trekbo:\n• Nay tezaz tarik screen\n• Nay email ka nay mregagetsi melEkhti\n\nDegimka tshaf wey "Tezaz Tekatateli" kab profile ka towiq! 📋`
    );
  }

  // ── 2. About Sara / Who are you ───────────────────────────────────────────
  if (matches(ABOUT_SARA_PATTERNS)) {
    pushTopic('about_sara');
    return respond(script,
      "I'm Sara, Azmarino's customer service assistant! 😊\n\nI'm here 24/7 to help you with:\n• Order tracking and status\n• Returns and refunds\n• Payment questions\n• Shipping information\n• Product questions\n• Account issues\n\nI speak both English and Tigrinya (ትግርኛ)! You can even write Tigrinya in Latin letters like 'kemey aleka' and I'll understand. 😊\n\nWhat can I help you with?",
      'ኣነ ሳራ እየ፡ ናይ ኣዝማሪኖ ኣገልግሎት ዓሚል ሓጋዚት! 😊\n\nብ24/7 ኣብዚ ኣለኹ ንሓገዝካ:\n• ትእዛዝ ክትትል\n• ምምላስን ካሕሳን\n• ናይ ክፍሊት ሕቶታት\n• ናይ ምልኣኽ ሓበሬታ\n• ናይ ፍርያት ሕቶታት\n• ናይ ኣካውንት ጸገማት\n\nብእንግሊዝኛን ብትግርኛን ክሕግዘካ ይኽእል! ብላቲን ፊደላት ውን ጽሓፍ "kemey aleka" ክርድኣካ እየ 😊\n\nእንታይ ክሕግዘካ?',
      'Ane Sara iye, nay Azmarino agelglot amil hagzit! 😊\n\nB24/7 abzi aleku nhagezka:\n• Tezaz kittel\n• Memelasn kahsan\n• Nay kiflit htetot\n• Nay milak habereta\n• Nay fereyat htetot\n• Nay account tsegmat\n\nBEngliznya, b Tigrinya (Geez), bLatin fidelet wn khgzeka ykhel! 😊\n\nEntay khgzeka?'
    );
  }

  // ── 3. Goodbye ────────────────────────────────────────────────────────────
  if (matches(GOODBYE_PATTERNS)) {
    pushTopic('goodbye');
    return respond(script,
      pick(["Goodbye! Have a wonderful day! 😊 Come back anytime you need help!", "See you later! 👋 Wishing you all the best! Don't hesitate to come back!", "Take care! 😊 It was great chatting with you! We're always here for you!"]),
      pick(['ደሓን ኩን! ጽቡቕ መዓልቲ ይግበረልካ! 😊 ዝኾነ ሓገዝ ምስ ደሊኻ ተመለስ!', 'ደሓን! 👋 ጽቡቕ ይግበረልካ! ክንሕግዘካ ኩሉ ግዜ ድሉዋት ኢና!', 'ደሓን ኩን! 😊 ምስ ዝደሊኻ ሓገዝ ናብዚ ተመለስ! ኣገልግሎትና ንዓኻ እዩ!']),
      pick(['Dehan kun! Tsbuq mealti ygberelka! 😊 Zkone hagez ms delika temeles!', 'Dehan! 👋 Tsbuq ygberelka! Knhgzeka kulu gze dluwat ina!', 'Dehan kun! 😊 Ms zdelika hagez nabzi temeles!'])
    );
  }

  // ── 4. Order tracking intent ──────────────────────────────────────────────
  const inlineAzm = msg.toUpperCase().match(/AZM\d+/);

  if (inlineAzm) {
    pushTopic('order');
    const orderId = inlineAzm[0];
    return respond(script,
      `I see order #${orderId}! 📦\n\nFor real-time tracking, please go to "Track Order" from your profile and enter this number there.\n\nYou'll see the full timeline — from processing to delivery! 🚚\n\nNeed anything else? 😊`,
      `ትእዛዝ #${orderId} ሪኤዮ! 📦\n\nናይ ብቐጥታ ክትትል ንምርኣይ ካብ ፕሮፋይልካ "ትእዛዝ ተኸታተል" ጠውቕ ነዚ ቁጽሪ ኣእቱ።\n\nምሉእ ፍሰት ትእዛዝ ክትርኢ ኢኻ — ካብ ምዝገባ ክሳብ ደሊቨሪ! 🚚\n\nካልእ ሓገዝ ትደሊ? 😊`,
      `Tezaz #${orderId} riyeyo! 📦\n\nNay bqetsta kittel nmray kab profile ka "Tezaz Tekatateli" towiq nezi qutsri aEtu.\n\nMluE fset tezaz ktri ika — kab mzgeba ksab delivery! 🚚\n\nKalE hagez tdeli? 😊`
    );
  }

  if (matches(ORDER_PATTERNS)) {
    conversationState = 'AWAIT_ORDER';
    pushTopic('order');
    return respond(script,
      '📦 I\'d love to help with your order!\n\nShare your order number — it starts with AZM (example: AZM104823).\n\nYou can find it in:\n• Your Order History screen\n• Your confirmation email 📧\n\nOr you can go directly to "Track Order" from your profile for full tracking! 😊',
      '📦 ብትእዛዝካ ክሕግዘካ ደስ ይብለኒ!\n\nናይ ትእዛዝ ቁጽርኻ ጸሓፍ — AZM ብዝጅምር (ኣብነት: AZM104823)።\n\nካበይ ትረኽቦ:\n• ናይ ትእዛዝ ታሪኽ ስክሪን\n• ኢመይልካ 📧\n\nወይ ካብ ፕሮፋይልካ "ትእዛዝ ተኸታተል" ጠውቕ! 😊',
      '📦 Btezazka khgzeka des ybleni!\n\nNay tezaz qutsrka tshaf — AZM bzjmir (abnit: AZM104823).\n\nKabey trekbo:\n• Nay tezaz tarik screen\n• Email ka 📧\n\nWey kab profile ka "Tezaz Tekatateli" towiq! 😊'
    );
  }

  // ── 5. Greetings & How are you ────────────────────────────────────────────
  const isGreeting = matches(GREETING_PATTERNS);
  const isHowAreYou = matches(HOW_ARE_YOU_PATTERNS);

  if (isGreeting && isHowAreYou) {
    pushTopic('greeting');
    return respond(script,
      pick(["Hi there! I'm Sara, doing great and ready to help! 😊 How are you doing today?", "Hello! I'm wonderful, thanks for asking! 😊 How about you? What brings you here today?", "Hey! Sara here, feeling fantastic! 😊 How are you? Need help with anything?"]),
      pick(['ሰላም! ኣነ ሳራ ደሓን እየ ንሓገዝካ ድልውቲ! 😊 ንስኻኸ ከመይ ኣለኻ ሎሚ?', 'ሰላም! ብጣዕሚ ጽቡቕ ይስምዓኒ ኣለኹ! 😊 ንስኻ ከመይ? እንታይ ክሕግዘካ?', 'ሃሎ! ሳራ እየ፡ ደሓን እየ! 😊 ከመይ ኣለኻ? ሓገዝ ትደሊ ዲኻ?']),
      pick(['Selam! Ane Sara dehan iye nhagezka dluwti! 😊 Niskake kemey aleka lomi?', 'Selam! Btaami tsbuq ysmEani aleku! 😊 Niska kemey? Entay khgzeka?', 'Halo! Sara iye, dehan iye! 😊 Kemey aleka? Hagez tdeli dika?'])
    );
  }

  if (isHowAreYou) {
    pushTopic('greeting');
    return respond(script,
      pick(["I'm doing great, thank you for asking! 😊 How about you? What can I help you with today?", "Feeling wonderful! 😊 How are you? I'm here for whatever you need!"]),
      pick(['ደሓን እየ ስለ ዝሓተትካኒ የቐንየልካ! 😊 ንስኻኸ ከመይ ኣለኻ? እንታይ ክሕግዘካ?', 'ብጣዕሚ ጽቡቕ! 😊 ከመይ ኣለኻ? ዝኾነ ሓገዝ ኣብዚ ኣለኹ!']),
      pick(['Dehan iye sle zhatetkani yeqenyelelka! 😊 Niskake kemey aleka? Entay khgzeka?', 'Btaami tsbuq! 😊 Kemey aleka? Zkone hagez abzi aleku!'])
    );
  }

  if (isGreeting) {
    pushTopic('greeting');
    return respond(script,
      pick(["Hi! Sara here 😊 Welcome to Azmarino! How can I help you today?", "Hello! 😊 I'm Sara, your Azmarino assistant. What can I do for you?", "Hey there! Welcome! 😊 I'm here to help with orders, shipping, returns, and more. What do you need?"]),
      pick(['ሰላም! ሳራ እየ 😊 ናብ ኣዝማሪኖ ብሰላም ብምምጻእኩም! እንታይ ክሕግዘኩም?', 'ሃሎ! 😊 ኣነ ሳራ ናይ ኣዝማሪኖ ሓጋዚት። ትእዛዝ፡ ምልኣኽ፡ ምምላስ ወይ ካልእ ንገረኒ!', 'ሰላም! 😊 ብሓጎስ ይቕበለኩም! እንታይ ከናድየልኩም?']),
      pick(['Selam! Sara iye 😊 Nab Azmarino bselam bmimtsaEkum! Entay khgzekum?', 'Halo! 😊 Ane Sara nay Azmarino hagzit. Tezaz, milak, memelasi wey kalE ngereni!', 'Selam! 😊 Bhagos yqbelekum! Entay kenadyelkum?'])
    );
  }

  // ── 6. I'm fine / positive sentiment ──────────────────────────────────────
  if (matches(FINE_PATTERNS)) {
    pushTopic('sentiment');
    if (lang === 'en') {
      return pick([
        "Happy to hear that! 😊 If you need anything — orders, payments, delivery, or just advice — I'm right here!",
        "Glad you're doing well! 😊 What can I help you with today? I'm all ears!",
        "Great to hear! 😊 Feel free to ask me anything about Azmarino!",
      ]);
    }
    return pick([
      'ደሓን ከም ኣለኻ ብጣዕሚ ደስ ይብለኒ! 😊 ትእዛዝ፡ ክፍሊት፡ ምልኣኽ ወይ ካልእ ሓገዝ እንተድሊኻ ኣብዚ ኣለኹ!',
      'ጽቡቕ! 😊 ዝኾነ ሕቶ ምስ ሃለወካ ንገረኒ! ብሓጎስ ክሕግዘካ!',
    ]);
  }

  // ── 7. Thanks ─────────────────────────────────────────────────────────────
  if (matches(THANKS_PATTERNS)) {
    pushTopic('thanks');
    if (lang === 'en') {
      return pick([
        "You're welcome! 😊 Happy to help! Let me know if there's anything else!",
        "My pleasure! 🌟 That's what I'm here for! Anything else?",
        "Anytime! 😊 Your satisfaction is our top priority! Need anything else?",
      ]);
    }
    return pick([
      'ብሓጎስ! 😊 ሓጎስ ዓሚልና ኣገልግሎትና እዩ! ካልእ ሕቶ ኣሎካ?',
      'ዋእ ብሓጎስ! 🌟 ንዓኻ ኢና ንሰርሕ! ካልእ እንተድሊኻ ንገረኒ!',
      'ኩሉ ግዜ! 😊 ዕግበት ዓሚልና ቀዳምነትና እዩ! ካልእ ክሕግዘካ?',
    ]);
  }

  // ── 8. Returns & Refunds ──────────────────────────────────────────────────
  if (matches(RETURN_PATTERNS)) {
    pushTopic('returns');
    if (lang === 'en') {
      return (
        'Returns are easy with Azmarino! 📦\n\n' +
        '✅ 30-day return policy from delivery date\n' +
        '✅ Items must be in original packaging and unused\n' +
        '✅ Refunds processed within 5-7 business days\n' +
        '✅ Free return shipping on defective items\n\n' +
        'To start a return:\n' +
        '1. Email support@azmarino.online with your order number\n' +
        '2. We\'ll send you return instructions\n' +
        '3. Ship it back and we\'ll process your refund!\n\n' +
        'Any questions about a specific return? 😊'
      );
    }
    return (
      'ምምላስ ኣብ ኣዝማሪኖ ቀሊል እዩ! 📦\n\n' +
      '✅ 30 መዓልቲ ካብ ዝተቐበልካሉ ዕለት\n' +
      '✅ ፍርያት ኣብ ኦሪጅናል መሸፈኒ ዘይተጠቐምካሉ ክኸውን ኣለዎ\n' +
      '✅ ገንዘብ ብ 5-7 ናይ ስራሕ መዓልታት ይምለሰልካ\n' +
      '✅ ጐድለት ዘለዎ ፍርያት ናጻ ምምላስ\n\n' +
      'ንምምላስ:\n' +
      '1. support@azmarino.online ናይ ትእዛዝ ቁጽርኻ ጽሓፍ\n' +
      '2. ናይ ምምላስ መምርሒ ክንሰደልካ\n' +
      '3. ልኣኾ ገንዘብካ ክንመልሰልካ!\n\n' +
      'ብዛዕባ ፍሉይ ምምላስ ሕቶ ኣሎካ? 😊'
    );
  }

  // ── 9. Payment ────────────────────────────────────────────────────────────
  if (matches(PAYMENT_PATTERNS)) {
    pushTopic('payment');
    if (lang === 'en') {
      return (
        'We accept these payment methods: 💳\n\n' +
        '• 💳 Credit/Debit Cards (Visa, Mastercard, Amex)\n' +
        '• 🏦 Bank Transfer\n' +
        '• 📱 Mobile Payment\n\n' +
        '🔒 All payments are 100% secure with SSL encryption!\n\n' +
        'Payment is processed at checkout. Your card is only charged when your order is confirmed.\n\n' +
        'Having trouble with payment? Let me know the details! 😊'
      );
    }
    return (
      'እዞም ናይ ክፍሊት ኣገባባት ንቕበል: 💳\n\n' +
      '• 💳 Credit/Debit Cards (Visa, Mastercard, Amex)\n' +
      '• 🏦 Bank Transfer\n' +
      '• 📱 ሞባይል ክፍሊት\n\n' +
      '🔒 ኩሉ ክፍሊት 100% ውሑስ ብ SSL encryption!\n\n' +
      'ክፍሊት ኣብ ቸክኣውት ይፍጸም። ካርድኻ ትእዛዝ ምስ ተረጋገጸ ጥራይ እዩ ዝኽፈል።\n\n' +
      'ጸገም ኣብ ክፍሊት ኣሎካ? ዝርዝር ንገረኒ! 😊'
    );
  }

  // ── 10. Shipping ──────────────────────────────────────────────────────────
  if (matches(SHIPPING_PATTERNS)) {
    pushTopic('shipping');
    if (lang === 'en') {
      return (
        'Shipping with Azmarino: 🚚\n\n' +
        '🆓 FREE shipping on ALL orders!\n\n' +
        '📅 Delivery times:\n' +
        '• Europe: 2-5 business days\n' +
        '• Rest of world: 5-10 business days\n\n' +
        '📧 You\'ll receive:\n' +
        '• Order confirmation email immediately\n' +
        '• Tracking number when your order ships\n' +
        '• Delivery notification\n\n' +
        'You can track your order anytime from your profile! 📋\n\n' +
        'Waiting for a specific delivery? Share your order number! 😊'
      );
    }
    return (
      'ናይ ኣዝማሪኖ ምልኣኽ: 🚚\n\n' +
      '🆓 ናጻ ምልኣኽ ኣብ ኩሉ ትእዛዝ!\n\n' +
      '📅 ናይ ምብጻሕ ግዜ:\n' +
      '• ኣውሮጳ: 2-5 ናይ ስራሕ መዓልታት\n' +
      '• ዓለም ሙሉእ: 5-10 ናይ ስራሕ መዓልታት\n\n' +
      '📧 ክትረክብ ኢኻ:\n' +
      '• ናይ ምረጋገጺ ኢመይል ብቐጥታ\n' +
      '• ናይ ክትትል ቁጽሪ ምስ ተላእኸ\n' +
      '• ናይ ደሊቨሪ ሓበሬታ\n\n' +
      'ትእዛዝካ ካብ ፕሮፋይልካ ክትከታተል ትኽእል! 📋\n\n' +
      'ፍሉይ ትእዛዝ ትጽበ? ቁጽሩ ንገረኒ! 😊'
    );
  }

  // ── 11. Discounts ─────────────────────────────────────────────────────────
  if (matches(DISCOUNT_PATTERNS)) {
    pushTopic('discount');
    if (lang === 'en') {
      return (
        'Great news on deals! 🎉\n\n' +
        '🔥 Current offers:\n' +
        '• New customers: 15% off your first order!\n' +
        '• Flash Sales: Up to 70% off — check the home page!\n' +
        '• Free shipping on every order\n\n' +
        '💡 Tips to save more:\n' +
        '• Check our Flash Sales section daily — new deals every day!\n' +
        '• Follow us for exclusive promo codes\n\n' +
        'Happy shopping! 🛍️'
      );
    }
    return (
      'ናይ ዲስካውንት ሓበሬታ! 🎉\n\n' +
      '🔥 ሕጂ ዘለዉ ዲስካውንት:\n' +
      '• ሓደሽቲ ዓሚል: 15% ዲስካውንት ኣብ መጀመርታ ትእዛዝ!\n' +
      '• Flash Sales: ክሳብ 70% ዲስካውንት — ቀዳማይ ገጽ ርአ!\n' +
      '• ናጻ ምልኣኽ ኣብ ኩሉ ትእዛዝ\n\n' +
      '💡 ንምቑጣብ:\n' +
      '• Flash Sales ኩሉ ግዜ ርአ — ኩሉ መዓልቲ ሓደሽቲ ዲስካውንት!\n' +
      '• ተኸታተለና ንፍሉይ ናይ ዲስካውንት ኮድ\n\n' +
      'ጽቡቕ ምግዛእ! 🛍️'
    );
  }

  // ── 12. Products & Shopping ───────────────────────────────────────────────
  if (matches(PRODUCT_PATTERNS)) {
    pushTopic('products');
    if (lang === 'en') {
      return (
        "We have a great selection! 🛍️\n\n" +
        "👕 Clothing:\n" +
        "• Men's fashion\n• Women's fashion\n• Kids' clothing\n\n" +
        "👟 Shoes & 👜 Bags/Accessories\n\n" +
        "📱 Electronics:\n" +
        "• Phones & tablets\n• Laptops\n• Headphones & earbuds\n• Smartwatches\n\n" +
        "All products are 100% original with quality guarantee! ✨\n\n" +
        "Looking for something specific? Tell me what you need and I can help you find it! 😊"
      );
    }
    return (
      'ብዙሕ ዓይነት ፍርያት ኣሎና! 🛍️\n\n' +
      '👕 ክዳውንቲ:\n' +
      '• ደቂ ተባዕትዮ\n• ደቂ ኣንስትዮ\n• ህጻናት\n\n' +
      '👟 ጫማ & 👜 ሳንጣ/ተወሳኺ\n\n' +
      '📱 ኤሌክትሮኒክስ:\n' +
      '• ሞባይል & ታብሌት\n• ላፕቶፕ\n• ሄድፎን & ኢርባድ\n• ስማርት ዋች\n\n' +
      'ኩሉ ፍርያት 100% ኦሪጅናል ብውሕስነት! ✨\n\n' +
      'ፍሉይ ዓይነት ትደሊ? ንገረኒ ክሕግዘካ! 😊'
    );
  }

  // ── 13. Quality ───────────────────────────────────────────────────────────
  if (matches(QUALITY_PATTERNS)) {
    pushTopic('quality');
    if (lang === 'en') {
      return (
        'Quality is our top priority! ✨\n\n' +
        '✅ 100% original products — no fakes, ever!\n' +
        '✅ Every item is quality-inspected before shipping\n' +
        '✅ We work with trusted global suppliers\n' +
        '✅ 30-day return if you\'re not satisfied\n\n' +
        'We believe you should love what you buy! If something isn\'t right, we\'ll make it right. 😊'
      );
    }
    return (
      'ጽሬት ቀዳምነትና እዩ! ✨\n\n' +
      '✅ 100% ኦሪጅናል ፍርያት — ፈልሲ ፈጺሙ የለን!\n' +
      '✅ ኩሉ ፍርያት ቅድሚ ምልኣኽ ይምርመር\n' +
      '✅ ምስ ዝተኣመኑ ዓለማዊ ሰኸፍቲ ንሰርሕ\n' +
      '✅ 30 መዓልቲ ምምላስ ዕጉብ ኣብ ዘይኮንካሉ\n\n' +
      'ዝገዛእካዮ ክፈትወካ ኣለዎ! ጸገም ምስ ሃለወ ክነስተኻኽል ኢና 😊'
    );
  }

  // ── 14. Problems / Complaints ─────────────────────────────────────────────
  if (matches(PROBLEM_PATTERNS)) {
    pushTopic('problem');
    if (lang === 'en') {
      return (
        "I'm really sorry you're having trouble! 😔\n\n" +
        "I want to help fix this right away. Could you tell me:\n\n" +
        "1. What happened? (describe the issue)\n" +
        "2. Your order number (if related to an order)\n\n" +
        "Common issues I can help with:\n" +
        "• Wrong item received\n" +
        "• Item damaged during shipping\n" +
        "• Order hasn't arrived\n" +
        "• Payment issue\n" +
        "• App not working properly\n\n" +
        "Or email us directly: support@azmarino.online\n" +
        "We respond within 24 hours! 📧"
      );
    }
    return (
      'ብጣዕሚ ይቕሬታ ጸገም ኣጋጢሙካ! 😔\n\n' +
      'ብቕልጡፍ ክሕግዘካ ደስ ይብለኒ። ነዞም ንገረኒ:\n\n' +
      '1. እንታይ ኮነ? (ጸገምካ ግለጽ)\n' +
      '2. ናይ ትእዛዝ ቁጽርኻ (ምስ ትእዛዝ ዝተሓሓዝ ምስ ዝኸውን)\n\n' +
      'ልሙዳት ጸገማት ክሕግዘካ ዝኽእል:\n' +
      '• ጌጋ ፍርያት ተቐቢልካ\n' +
      '• ፍርያት ኣብ ምልኣኽ ተበላሺዩ\n' +
      '• ትእዛዝ ኣይመጸን\n' +
      '• ናይ ክፍሊት ጸገም\n' +
      '• ኣፕ ጸገም\n\n' +
      'ወይ ብቐጥታ ጸሓፈልና: support@azmarino.online\n' +
      'ኣብ 24 ሰዓት ክንምልሰልካ! 📧'
    );
  }

  // ── 15. Account ───────────────────────────────────────────────────────────
  if (matches(ACCOUNT_PATTERNS)) {
    pushTopic('account');
    if (lang === 'en') {
      return (
        "Account help: 👤\n\n" +
        "• Forgot password? Use 'Forgot Password' on the login screen\n" +
        "• Change email/phone? Go to Profile > Edit Profile\n" +
        "• Delete account? Email support@azmarino.online\n\n" +
        "Having a specific account issue? Tell me more and I'll help! 😊"
      );
    }
    return (
      'ናይ ኣካውንት ሓገዝ: 👤\n\n' +
      '• ፓስዎርድ ረሲዕካ? ኣብ ሎግ ኢን ስክሪን "ፓስዎርድ ረሲዐ" ጠውቕ\n' +
      '• ኢመይል/ቴሌፎን ምቕያር? ፕሮፋይል > ፕሮፋይል ቀይር\n' +
      '• ኣካውንት ምድምሳስ? support@azmarino.online ጸሓፍ\n\n' +
      'ፍሉይ ናይ ኣካውንት ጸገም ኣሎካ? ንገረኒ ክሕግዘካ! 😊'
    );
  }

  // ── 16. About Azmarino ────────────────────────────────────────────────────
  if (matches(ABOUT_AZMARINO_PATTERNS)) {
    pushTopic('about');
    if (lang === 'en') {
      return (
        "Azmarino is your trusted online store! 🛍️\n\n" +
        "🌍 We serve the Eritrean and Ethiopian diaspora worldwide\n" +
        "👕 Focus on quality fashion and electronics\n" +
        "🚚 Free worldwide shipping\n" +
        "🔒 100% secure payments\n" +
        "💬 24/7 customer support (that's me! 😊)\n\n" +
        "Our mission: bringing you quality products at fair prices, delivered to your door!\n\n" +
        "Visit our About Us page to learn more, or ask me anything! 😊"
      );
    }
    return (
      'ኣዝማሪኖ ዝተኣመነ ኦንላይን ድኳንኩም! 🛍️\n\n' +
      '🌍 ንኤርትራውያንን ኢትዮጵያውያንን ኣብ ምሉእ ዓለም ነገልግል\n' +
      '👕 ብጽሬት ዝተመርጹ ክዳውንትን ኤሌክትሮኒክስን\n' +
      '🚚 ናጻ ምልኣኽ ናብ ዓለም ሙሉእ\n' +
      '🔒 100% ውሑስ ክፍሊት\n' +
      '💬 24/7 ኣገልግሎት ዓሚል (ሳራ እየ! 😊)\n\n' +
      'ዕላማና: ጽሩይ ፍርያት ብቕኑዕ ዋጋ ናብ ማዕጾኹም ነብጽሕ!\n\n' +
      'ዝያዳ ንምፍላጥ "ብዛዕባና" ገጽ ርአ ወይ ሕተተኒ! 😊'
    );
  }

  // ── 17. Conversational / Emotional responses ──────────────────────────────
  // "I love" / "I like" patterns
  if (lower.match(/i love|i like|ፈቲየ|ይፈትዎ|fetiye|yfetiwo/i)) {
    pushTopic('positive');
    if (lang === 'en') {
      return pick([
        "That's wonderful to hear! 😊 We love our customers too! Is there anything I can help you with?",
        "So glad! 🥰 Your happiness means everything to us! Need help with anything?",
      ]);
    }
    return pick([
      'ብጣዕሚ ደስ ይብለኒ! 😊 ንዓሚልና ብጣዕሚ ንፈትዎም! ሓገዝ ትደሊ?',
      'ዋእ ጽቡቕ! 🥰 ሓጎስኩም ኩሉ ነገር እዩ ንዓና! ካልእ ክሕግዘካ?',
    ]);
  }

  // "I want" / "I need" patterns
  if (lower.match(/i want|i need|i'm looking|ደሊየ|ደልየ|ይደሊ|deliye|yideli|ideliye/i)) {
    pushTopic('intent');
    if (lang === 'en') {
      return "Sure! Tell me exactly what you're looking for and I'll do my best to help! 😊 You can also browse our categories on the home screen.";
    }
    return 'እወ! እንታይ ትደሊ ብዝርዝር ንገረኒ ክሕግዘካ! 😊 ኣብ ቀዳማይ ገጽ ውን ብኸተጎሪ ክትድሊ ትኽእል።';
  }

  // Emotional: angry, upset, frustrated
  if (lower.match(/angry|upset|frustrated|mad|hate|kkurat|kurfit|ሕራቐይ|ኩርፍት/i)) {
    pushTopic('negative');
    if (lang === 'en') {
      return (
        "I completely understand your frustration, and I'm truly sorry! 😔\n\n" +
        "Your feelings are valid. Let me help fix this:\n\n" +
        "1. Tell me what happened\n" +
        "2. I'll do everything I can to resolve it\n\n" +
        "If it's something I can't fix directly, I'll make sure it reaches our team immediately.\n\n" +
        "You can also reach our team at support@azmarino.online 📧"
      );
    }
    return (
      'ብቕንዕና ይርድኣኒ ኣሎ ብጣዕሚ ይቕሬታ! 😔\n\n' +
      'ስምዒትካ ቅኑዕ እዩ። ክሕግዘካ ፍቐደለይ:\n\n' +
      '1. እንታይ ኮነ ንገረኒ\n' +
      '2. ክእለት ዘለኒ ኩሉ ክገብር\n\n' +
      'ባዕለይ ክፈትሖ ዘይኽእል ምስ ዝኸውን ናብ ጋንታና ብቕልጡፍ ከብጽሖ እየ።\n\n' +
      'support@azmarino.online ውን ክትጽሕፈልና ትኽእል 📧'
    );
  }

  // "What can you do" / capabilities
  if (lower.match(/what can you|what do you do|enttay tikheli|entay tkeli|እንታይ ትኽእሊ/i)) {
    pushTopic('capabilities');
    if (lang === 'en') {
      return (
        "Here's everything I can help you with! 💪\n\n" +
        "📦 Order tracking & status\n" +
        "↩️ Returns & refunds\n" +
        "💳 Payment questions\n" +
        "🚚 Shipping & delivery info\n" +
        "🎁 Discounts & offers\n" +
        "👕 Product information\n" +
        "👤 Account help\n" +
        "🏢 About Azmarino\n\n" +
        "Just ask me anything! I'm here for you 24/7 😊"
      );
    }
    return (
      'ኣብ ኩሉ ክሕግዘካ ይኽእል! 💪\n\n' +
      '📦 ትእዛዝ ክትትል\n' +
      '↩️ ምምላስ & ካሕሳ\n' +
      '💳 ናይ ክፍሊት ሕቶታት\n' +
      '🚚 ምልኣኽ & ደሊቨሪ\n' +
      '🎁 ዲስካውንት & ዕድላት\n' +
      '👕 ናይ ፍርያት ሓበሬታ\n' +
      '👤 ናይ ኣካውንት ሓገዝ\n' +
      '🏢 ብዛዕባ ኣዝማሪኖ\n\n' +
      'ዝኾነ ሕተተኒ! ብ24/7 ኣብዚ ኣለኹ 😊'
    );
  }

  // ── 18. Fallback — intelligent catch-all ──────────────────────────────────
  pushTopic('general');
  if (lang === 'en') {
    return pick([
      "Thanks for your message! 😊 I'm not 100% sure I understood. Could you rephrase that? Or try one of these:\n\n• Track your order\n• Ask about returns\n• Payment help\n• Shipping info\n• Product questions\n\nOr email us at support@azmarino.online for detailed help!",
      "Hmm, let me make sure I help you correctly! 🤔 Could you tell me more about what you need? I'm great with orders, shipping, payments, returns, and product questions!\n\nYou can also email support@azmarino.online for anything complex 📧",
      "I want to give you the best answer! 😊 Could you try asking in a different way? I'm here to help with:\n\n📦 Orders  🚚 Shipping  💳 Payments  ↩️ Returns  🎁 Deals\n\nOr reach our team at support@azmarino.online!",
    ]);
  }
  return pick([
    'ስለ መልእኽትኻ የቐንየልካ! 😊 ሕቶኻ ብዝርዝር ክትገልጸለይ ትኽእል? ወይ ካብዞም ምረጽ:\n\n• ትእዛዝ ክትትል\n• ምምላስ\n• ክፍሊት\n• ምልኣኽ\n• ፍርያት\n\nወይ support@azmarino.online ጸሓፈልና!',
    'ብትኽክል ክሕግዘካ ደስ ይብለኒ! 🤔 ሕቶኻ ብኻልእ መንገዲ ክትገልጸለይ? ብትእዛዝ፡ ምልኣኽ፡ ክፍሊት፡ ምምላስ ክሕግዘካ ይኽእል!\n\nsupport@azmarino.online ውን ክትጽሕፈልና ትኽእል 📧',
    'ብሩህ ክኸውን ደስ ይብለኒ! 😊 ሕቶኻ ብኻልእ ጽሓፈለይ? ኣብዚ ክሕግዘካ:\n\n📦 ትእዛዝ  🚚 ምልኣኽ  💳 ክፍሊት  ↩️ ምምላስ  🎁 ዲስካውንት\n\nወይ support@azmarino.online!',
  ]);
};

// ──────────────────────────────────────────────────────────────────────────────

const getInitialMessage = (lang) =>
  lang === 'en'
    ? "Hi! I'm Sara, Azmarino's customer service assistant 😊\n\nI can help you with orders, shipping, returns, payments, and more! I speak English and Tigrinya (even in Latin letters like 'selam' or 'kemey aleka').\n\nWhat can I do for you today?"
    : "ሰላም! ኣነ ሳራ እየ፡ ናይ ኣዝማሪኖ ኣገልግሎት ዓሚል ሓጋዚት 😊\n\nብትእዛዝ፡ ምልኣኽ፡ ምምላስ፡ ክፍሊት ክሕግዘካ ይኽእል! ብእንግሊዝኛ ውን ብትግርኛ (ብላቲን ፊደላት ውን ክም 'selam' ወይ 'kemey aleka')።\n\nእንታይ ክሕግዘካ?";

const ChatSupportScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [chatState, setChatState] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: getInitialMessage('ti'),
      isBot: true,
      time: 'ሕጂ',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  const msgId = useRef(2);

  // Update the greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [
          {
            ...prev[0],
            text: getInitialMessage(language),
            time: language === 'en' ? 'Now' : 'ሕጂ',
          },
        ];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages, isTyping]);

  // Reset module-level state when screen mounts
  useEffect(() => {
    conversationState = null;
    recentTopics = [];
    setChatState(null);
  }, []);

  const sendMessage = (text) => {
    const msgText = (text || message).trim();
    if (!msgText) return;

    const userMsg = {
      id: msgId.current++,
      text: msgText,
      isBot: false,
      time: language === 'en' ? 'Now' : 'ሕጂ',
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsTyping(true);

    const reply = getSmartReply(msgText, setChatState, language, navigation);
    setChatState(conversationState);

    // Simulate human-like typing speed (varies by length)
    const typingDelay = Math.min(2500, 800 + Math.random() * 400 + reply.length * 5);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: msgId.current++,
          text: reply,
          isBot: true,
          time: language === 'en' ? 'Now' : 'ሕጂ',
        },
      ]);
    }, typingDelay);
  };

  const quickReplies =
    language === 'en'
      ? [
          {label: '📦 Track order', msg: 'Where is my order?'},
          {label: '↩️ Returns', msg: 'How do returns work?'},
          {label: '💳 Payment', msg: 'What payment methods do you accept?'},
          {label: '🚚 Shipping', msg: 'How long does shipping take?'},
          {label: '🎁 Discounts', msg: 'Are there any discounts?'},
          {label: '👕 Products', msg: 'What products do you sell?'},
        ]
      : [
          {label: '📦 ትእዛዝ ክትትል', msg: 'ትእዛዘይ ኣበይ ኣሎ?'},
          {label: '↩️ ምምላስ', msg: 'ምምላስ ከመይ ይካየድ?'},
          {label: '💳 ክፍሊት', msg: 'ናይ ክፍሊት ኣገባባት እንታይ እዩ?'},
          {label: '🚚 ምልኣኽ', msg: 'ምልኣኽ ክንደይ ይወስድ?'},
          {label: '🎁 ዲስካውንት', msg: 'ዲስካውንት ኣሎ ድዩ?'},
          {label: '👕 ፍርያት', msg: 'እንታይ ፍርያት ኣለኩም?'},
        ];

  const headerTitle =
    language === 'en' ? 'Sara — Customer Service' : 'ሳራ — ኣገልግሎት ዓሚል';

  const headerSubtitleTyping =
    language === 'en' ? '✍️ Typing...' : '✍️ ትጽሕፍ ኣላ...';

  const headerSubtitleOnline =
    language === 'en' ? '🟢 Online • 24/7' : '🟢 ኦንላይን • 24/7';

  const hintBannerText =
    language === 'en'
      ? '📦 Share your order number — example: AZM104823'
      : '📦 ናይ ትእዛዝ ቁጽርካ ኣካፍሊ — ኣብነት: AZM104823';

  const inputPlaceholderAwait =
    language === 'en'
      ? 'Enter your order number (AZM...)...'
      : 'ናይ ትእዛዝ ቁጽርካ ጸሓፍ (AZM...)...';

  const inputPlaceholderDefault =
    language === 'en' ? 'Type your message...' : 'መልእኽትኻ ጸሓፍ...';

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
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>ሳ</Text>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={[styles.headerTitle, {color: theme.text}]}>
                {headerTitle}
              </Text>
              <Text style={[styles.headerSubtitle, {color: isTyping ? '#27ae60' : theme.subText}]}>
                {isTyping ? headerSubtitleTyping : headerSubtitleOnline}
              </Text>
            </View>
          </View>
          <View style={{width: 28}} />
        </View>

        {/* Waiting-for-order-number hint banner */}
        {chatState === 'AWAIT_ORDER' && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>
              {hintBannerText}
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
            style={[
              styles.input,
              {
                backgroundColor: theme.bg,
                color: theme.text,
                borderColor: chatState === 'AWAIT_ORDER' ? '#FF0000' : theme.border,
              },
            ]}
            placeholder={
              chatState === 'AWAIT_ORDER'
                ? inputPlaceholderAwait
                : inputPlaceholderDefault
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
    fontSize: fs(16),
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
  headerTitle: {fontSize: fs(16), fontWeight: 'bold'},
  headerSubtitle: {fontSize: fs(12), marginTop: 1},
  hintBanner: {
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hintText: {
    color: '#FF0000',
    fontSize: fs(13),
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
  botAvatarText: {color: '#fff', fontWeight: 'bold', fontSize: fs(12)},
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
  messageText: {fontSize: fs(15), lineHeight: fs(22), marginBottom: 4},
  messageTime: {fontSize: fs(11), alignSelf: 'flex-end'},
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
  quickBtnText: {fontSize: fs(13), fontWeight: '600'},
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
    fontSize: fs(15),
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
  sendBtnText: {color: '#fff', fontSize: fs(20), fontWeight: 'bold'},
});

export default ChatSupportScreen;
