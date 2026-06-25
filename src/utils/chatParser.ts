// Regular expression to match WhatsApp chat export message headers.
const MSG_REGEX = /^\[?(\d{1,4}[-./\s]\d{1,2}[-./\s]\d{1,4}),?\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[APaP][Mm]|\s* [APaP][Mm])?)\]?\s*(?:-\s*)?([^:]+):\s+(.*)$/;

export interface ChatStats {
  participants: string[];
  totalMessages: number;
  messageCounts: Record<string, number>;
  wordCounts: Record<string, number>;
  avgMessageLength: Record<string, number>; // average words per message
  doubleTextCounts: Record<string, number>;
  initiationCounts: Record<string, number>;
  avgResponseTimes: Record<string, number>; // in seconds
  emojiCounts: Record<string, Record<string, number>>;
  topEmojis: Record<string, { emoji: string; count: number }[]>;
  hourlyActivity: Record<string, number[]>; // participant -> 24-hour array
  weeklyActivity: Record<string, number[]>; // participant -> 7-day array
  mostActiveDay: {
    date: string;
    count: number;
  };
  longestStreak: number;
  currentStreak: number;
  
  // Premium stats
  longestSilence: {
    duration: number; // in seconds
    date: string;
    ignorer: string;
  };
  lateNightRatios: Record<string, number>;
  daytimeRatios: Record<string, number>;
  loveSentimentRatios: Record<string, number>;
  
  redFlags: {
    dryTexts: Record<string, number>;
    arguments: Record<string, number>;
  };
  greenFlags: {
    affection: Record<string, number>;
    longTexts: Record<string, number>;
  };
  morningTexts: Record<string, number>;
  nightTexts: Record<string, number>;
  maxConsecutiveTexts: Record<string, number>;
  uniqueWordsCount: Record<string, number>;
  mediaCounts: Record<string, number>;

  // V5 Additions
  monthlyActivity: Record<string, number>; // YYYY-MM -> message count
  sparkShift: {
    firstPeriodAvg: number;  // early stage daily texts avg
    recentPeriodAvg: number; // recent stage daily texts avg
  };
  petNamesCounts: Record<string, number>;
  apologyCounts: Record<string, number>;
  questionCounts: Record<string, number>;
  vocabularyOverlapPct: number;

  // V6 conversion-driving stats
  firstILoveYou: { sender: string; date: string } | null;
  daysTogether: number;
  relationshipStartDate: string;
  // Per-person "effort / interest" components (0..1 share owned by participant[0])
  interestBalance: {
    p1Score: number; // 0..100, p1's share of total effort
    p2Score: number; // 0..100
    moreInvested: string;
    verdict: string;
  };
}

const LOVE_DECLARATIONS = [
  "i love you", "i luv you", "i luv u", "i love u", "love you so", "ily", "iloveyou"
];

const ROMANTIC_KEYWORDS = [
  "love", "babe", "baby", "miss", "heart", "kiss", "muah", "cute", 
  "darling", "honey", "hugs", "hug", "sweet", "dear", "beautiful", 
  "handsome", "ily", "love you", "❤️", "💖", "💕", "😘", "😍"
];

const ARGUMENT_KEYWORDS = [
  "stop", "angry", "ignore", "whatever", "annoying", "fight", 
  "mad", "shut up", "hate", "ugh", "annoyed", "stupid"
];

const DRY_KEYWORDS = ["ok", "k", "cool", "fine", "nice", "yeah", "okey", "okay", "yup", "yea"];

const PET_NAMES_KEYWORDS = [
  "babe", "baby", "honey", "darling", "cutie", "sweetheart", "love", "sweetie", 
  "babu", "shona", "jaan", "sweetpea", "boo"
];

const APOLOGY_KEYWORDS = ["sorry", "apologize", "my bad", "forgive", "apology", "maaf"];

// Matches a keyword as a whole word/phrase to avoid false positives
// (e.g. "miss" inside "dismiss", "hate" inside "whatever"). Emoji/symbol
// keywords fall back to plain substring matching.
function containsKeyword(textLower: string, keywords: string[]): boolean {
  return keywords.some((kw) => {
    if (/^[a-z][a-z ]*$/.test(kw)) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`).test(textLower);
    }
    return textLower.includes(kw);
  });
}

// Helper to extract emojis
function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23FA}\u{24C2}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;
  return text.match(emojiRegex) || [];
}

// Helper to parse date/time
function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    const cleanDateStr = dateStr.replace(/[-.\s]/g, '/');
    const dateParts = cleanDateStr.split('/');
    if (dateParts.length !== 3) return null;

    let day = 0, month = 0, year = 0;
    
    if (dateParts[0].length === 4) {
      year = parseInt(dateParts[0]);
      month = parseInt(dateParts[1]) - 1;
      day = parseInt(dateParts[2]);
    } else if (dateParts[2].length === 4) {
      const p0 = parseInt(dateParts[0]);
      const p1 = parseInt(dateParts[1]);
      const p2 = parseInt(dateParts[2]);
      
      if (p0 > 12) {
        day = p0;
        month = p1 - 1;
      } else if (p1 > 12) {
        month = p0 - 1;
        day = p1;
      } else {
        day = p0;
        month = p1 - 1;
      }
      year = p2;
    } else {
      const p0 = parseInt(dateParts[0]);
      const p1 = parseInt(dateParts[1]);
      const p2 = parseInt(dateParts[2]);
      
      year = p2 + 2000;
      if (p0 > 12) {
        day = p0;
        month = p1 - 1;
      } else {
        day = p0;
        month = p1 - 1;
      }
    }

    let cleanTimeStr = timeStr.replace(/\u202f/g, ' ').trim();
    const is12Hour = /[a-zA-Z]/.test(cleanTimeStr);
    const pm = /pm/i.test(cleanTimeStr);
    
    cleanTimeStr = cleanTimeStr.replace(/[a-zA-Z]/g, '').trim();
    const timeParts = cleanTimeStr.split(/[:.]/);
    
    let hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2]) || 0;

    if (is12Hour) {
      if (pm && hours < 12) hours += 12;
      if (!pm && hours === 12) hours = 0;
    }

    const date = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

interface RawParsedMessage {
  timestamp: Date;
  sender: string;
  message: string;
}

export function parseWhatsAppChat(rawText: string): ChatStats {
  const lines = rawText.split(/\r?\n/);
  const parsedMessages: RawParsedMessage[] = [];
  let currentMsg: RawParsedMessage | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const match = line.match(MSG_REGEX);
    if (match) {
      const [, dateStr, timeStr, sender, message] = match;
      const timestamp = parseDateTime(dateStr, timeStr);
      
      if (timestamp) {
        if (currentMsg) {
          parsedMessages.push(currentMsg);
        }
        currentMsg = {
          timestamp,
          sender: sender.trim(),
          message: message.trim(),
        };
      }
    } else if (currentMsg) {
      currentMsg.message += '\n' + line;
    }
  }
  
  if (currentMsg) {
    parsedMessages.push(currentMsg);
  }

  // Filter out system messages
  const systemKeywords = [
    'end-to-end encrypted',
    'created this group',
    'added you',
    'changed the subject',
    'changed the icon',
    'joined using this group\'s invite link',
    'left the group'
  ];

  const filteredMessages = parsedMessages.filter(msg => {
    const textLower = msg.message.toLowerCase();
    const isSystem = systemKeywords.some(keyword => textLower.includes(keyword));
    return !isSystem;
  });

  const senderCounts: Record<string, number> = {};
  for (const m of filteredMessages) {
    senderCounts[m.sender] = (senderCounts[m.sender] || 0) + 1;
  }

  const sortedSenders = Object.keys(senderCounts).sort((a, b) => senderCounts[b] - senderCounts[a]);
  const participants = sortedSenders.slice(0, 2);

  const totalMessages = filteredMessages.filter(m => participants.includes(m.sender)).length;
  
  const messageCounts: Record<string, number> = {};
  const wordCounts: Record<string, number> = {};
  const doubleTextCounts: Record<string, number> = {};
  const initiationCounts: Record<string, number> = {};
  const emojiCounts: Record<string, Record<string, number>> = {};
  const hourlyActivity: Record<string, number[]> = {};
  const weeklyActivity: Record<string, number[]> = {};

  // V4/V5 stats counters
  const lateNightCounts: Record<string, number> = {};
  const daytimeCounts: Record<string, number> = {};
  const loveSentimentCounts: Record<string, number> = {};
  
  const dryTextCounts: Record<string, number> = {};
  const argumentCounts: Record<string, number> = {};
  const longTextCounts: Record<string, number> = {};
  const morningTextCounts: Record<string, number> = {};
  const nightTextCounts: Record<string, number> = {};
  const mediaCounts: Record<string, number> = {};
  
  const petNamesCounts: Record<string, number> = {};
  const apologyCounts: Record<string, number> = {};
  const questionCounts: Record<string, number> = {};

  const monthlyActivity: Record<string, number> = {};
  const dailyActivityCounts: Record<string, number> = {};
  
  const uniqueWordsSet: Record<string, Set<string>> = {};

  const responseTimeSums: Record<string, number> = {};
  const responseTimeCounts: Record<string, number> = {};

  for (const p of participants) {
    messageCounts[p] = 0;
    wordCounts[p] = 0;
    doubleTextCounts[p] = 0;
    initiationCounts[p] = 0;
    emojiCounts[p] = {};
    hourlyActivity[p] = Array(24).fill(0);
    weeklyActivity[p] = Array(7).fill(0);
    responseTimeSums[p] = 0;
    responseTimeCounts[p] = 0;
    
    lateNightCounts[p] = 0;
    daytimeCounts[p] = 0;
    loveSentimentCounts[p] = 0;
    
    dryTextCounts[p] = 0;
    argumentCounts[p] = 0;
    longTextCounts[p] = 0;
    morningTextCounts[p] = 0;
    nightTextCounts[p] = 0;
    mediaCounts[p] = 0;

    petNamesCounts[p] = 0;
    apologyCounts[p] = 0;
    questionCounts[p] = 0;
    
    uniqueWordsSet[p] = new Set<string>();
  }

  let maxSilenceMs = 0;
  let silenceDateStr = "N/A";
  let silenceIgnorer = "N/A";

  // First "I love you" tracker (V6)
  let firstILoveYou: { sender: string; date: string } | null = null;

  // Spam desperation meter variables
  const consecutiveCounts: Record<string, number> = {};
  const maxConsecutiveTexts: Record<string, number> = {};
  for (const p of participants) {
    consecutiveCounts[p] = 0;
    maxConsecutiveTexts[p] = 0;
  }
  let lastActiveSender: string | null = null;

  // Track daily first and last text senders
  const dailyFirstTexts: Record<string, { sender: string; time: Date }> = {};
  const dailyLastTexts: Record<string, { sender: string; time: Date }> = {};

  // Step 2: Accumulate stats
  for (let i = 0; i < filteredMessages.length; i++) {
    const msg = filteredMessages[i];
    if (!participants.includes(msg.sender)) continue;

    const sender = msg.sender;
    const time = msg.timestamp;

    messageCounts[sender]++;
    
    // Word counts & unique words
    const words = msg.message.split(/\s+/).filter(w => w.length > 0);
    wordCounts[sender] += words.length;
    for (const w of words) {
      const cleanW = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
      if (cleanW) {
        uniqueWordsSet[sender].add(cleanW);
      }
    }

    // Daily & Monthly active tracking
    const dateStr = time.getFullYear() + '-' + String(time.getMonth() + 1).padStart(2, '0') + '-' + String(time.getDate()).padStart(2, '0');
    dailyActivityCounts[dateStr] = (dailyActivityCounts[dateStr] || 0) + 1;

    const monthStr = time.getFullYear() + '-' + String(time.getMonth() + 1).padStart(2, '0');
    monthlyActivity[monthStr] = (monthlyActivity[monthStr] || 0) + 1;

    // Track daily first and last text
    if (!dailyFirstTexts[dateStr]) {
      dailyFirstTexts[dateStr] = { sender, time };
    }
    dailyLastTexts[dateStr] = { sender, time };

    // Hourly and weekly activity
    const hour = time.getHours();
    const dayOfWeek = time.getDay();
    hourlyActivity[sender][hour]++;
    weeklyActivity[sender][dayOfWeek]++;

    // Ratios: late night vs daytime
    if (hour >= 23 || hour < 4) {
      lateNightCounts[sender]++;
    }
    if (hour >= 9 && hour < 17 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      daytimeCounts[sender]++;
    }

    const textLower = msg.message.toLowerCase();
    
    // Check media
    if (textLower.includes("omitted") || textLower.includes("attachment") || textLower.includes("<media omitted>")) {
      mediaCounts[sender]++;
    }

    // Dry Responders
    const isDry = DRY_KEYWORDS.includes(textLower);
    if (isDry) {
      dryTextCounts[sender]++;
    }

    // Argument Words
    const isArgument = containsKeyword(textLower, ARGUMENT_KEYWORDS);
    if (isArgument) {
      argumentCounts[sender]++;
    }

    // Pet Names (V5)
    const isPetName = containsKeyword(textLower, PET_NAMES_KEYWORDS);
    if (isPetName) {
      petNamesCounts[sender]++;
    }

    // Apologies (V5)
    const isApology = containsKeyword(textLower, APOLOGY_KEYWORDS);
    if (isApology) {
      apologyCounts[sender]++;
    }

    // Questions (V5)
    const questionMarks = (msg.message.match(/\?/g) || []).length;
    questionCounts[sender] += questionMarks;

    // Paragraph texts (>20 words)
    if (words.length >= 20) {
      longTextCounts[sender]++;
    }

    // Love Sentiment
    const hasLoveWord = containsKeyword(textLower, ROMANTIC_KEYWORDS);
    if (hasLoveWord) {
      loveSentimentCounts[sender]++;
    }

    // First "I love you" detection (V6) - the first explicit declaration
    if (!firstILoveYou && LOVE_DECLARATIONS.some(kw => textLower.includes(kw))) {
      firstILoveYou = {
        sender,
        date: time.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      };
    }

    // Emojis
    const emojis = extractEmojis(msg.message);
    for (const emoji of emojis) {
      emojiCounts[sender][emoji] = (emojiCounts[sender][emoji] || 0) + 1;
    }

    // Spam desperation meter
    if (lastActiveSender === sender) {
      consecutiveCounts[sender]++;
      if (consecutiveCounts[sender] > maxConsecutiveTexts[sender]) {
        maxConsecutiveTexts[sender] = consecutiveCounts[sender];
      }
    } else {
      if (lastActiveSender) {
        consecutiveCounts[lastActiveSender] = 0;
      }
      consecutiveCounts[sender] = 1;
      lastActiveSender = sender;
    }

    // Gaps and Response speed
    if (i > 0) {
      let prevIndex = i - 1;
      while (prevIndex >= 0 && !participants.includes(filteredMessages[prevIndex].sender)) {
        prevIndex--;
      }
      
      if (prevIndex >= 0) {
        const prevMsg = filteredMessages[prevIndex];
        const prevSender = prevMsg.sender;
        const prevTime = prevMsg.timestamp;
        const diffMs = time.getTime() - prevTime.getTime();
        const diffMin = diffMs / (1000 * 60);
        const diffHours = diffMin / 60;

        if (prevSender !== sender) {
          if (diffHours < 12) {
            responseTimeSums[sender] += diffMs / 1000;
            responseTimeCounts[sender]++;
          }

          if (diffMs > maxSilenceMs) {
            maxSilenceMs = diffMs;
            silenceDateStr = prevTime.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            silenceIgnorer = sender;
          }
        }

        if (prevSender === sender && diffMin > 5) {
          doubleTextCounts[sender]++;
        }

        if (diffHours > 6) {
          initiationCounts[sender]++;
        }
      }
    } else {
      initiationCounts[sender]++;
    }
  }

  // Morning/Night champions calculations
  for (const dateStr of Object.keys(dailyFirstTexts)) {
    const firstText = dailyFirstTexts[dateStr];
    const hour = firstText.time.getHours();
    if (hour >= 6 && hour < 10) {
      morningTextCounts[firstText.sender]++;
    }

    const lastText = dailyLastTexts[dateStr];
    const lastHour = lastText.time.getHours();
    if (lastHour >= 22 || lastHour < 2) {
      nightTextCounts[lastText.sender]++;
    }
  }

  // Calculate spark shift (V5: Early stage daily average vs Recent stage daily average)
  const sortedDays = Object.keys(dailyActivityCounts).sort();
  let firstPeriodAvg = 0;
  let recentPeriodAvg = 0;

  if (sortedDays.length > 0) {
    // If we have at least 30 days of chat
    if (sortedDays.length >= 30) {
      const first30Days = sortedDays.slice(0, 15);
      const last30Days = sortedDays.slice(-15);
      
      const first30Count = first30Days.reduce((sum, day) => sum + dailyActivityCounts[day], 0);
      const last30Count = last30Days.reduce((sum, day) => sum + dailyActivityCounts[day], 0);
      
      firstPeriodAvg = Math.round((first30Count / first30Days.length) * 10) / 10;
      recentPeriodAvg = Math.round((last30Count / last30Days.length) * 10) / 10;
    } else {
      // Split the array in half
      const mid = Math.floor(sortedDays.length / 2);
      const firstHalf = sortedDays.slice(0, mid);
      const lastHalf = sortedDays.slice(mid);
      
      const firstHalfCount = firstHalf.reduce((sum, day) => sum + dailyActivityCounts[day], 0);
      const lastHalfCount = lastHalf.reduce((sum, day) => sum + dailyActivityCounts[day], 0);
      
      firstPeriodAvg = firstHalf.length > 0 ? Math.round((firstHalfCount / firstHalf.length) * 10) / 10 : 0;
      recentPeriodAvg = lastHalf.length > 0 ? Math.round((lastHalfCount / lastHalf.length) * 10) / 10 : 0;
    }
  }

  // Jaccard similarity for unique vocabulary overlap (V5)
  let vocabularyOverlapPct = 0;
  if (participants.length >= 2) {
    const s1 = uniqueWordsSet[participants[0]];
    const s2 = uniqueWordsSet[participants[1]];
    
    let intersection = 0;
    for (const w of s1) {
      if (s2.has(w)) {
        intersection++;
      }
    }
    const union = s1.size + s2.size - intersection;
    vocabularyOverlapPct = union > 0 ? Math.round((intersection / union) * 100) : 0;
  }

  // Calculate averages & ratios
  const avgMessageLength: Record<string, number> = {};
  const avgResponseTimes: Record<string, number> = {};
  const topEmojis: Record<string, { emoji: string; count: number }[]> = {};
  
  const lateNightRatios: Record<string, number> = {};
  const daytimeRatios: Record<string, number> = {};
  const loveSentimentRatios: Record<string, number> = {};

  const dryTexts: Record<string, number> = {};
  const args: Record<string, number> = {};
  const affection: Record<string, number> = {};
  const longTexts: Record<string, number> = {};
  const morningTexts: Record<string, number> = {};
  const nightTexts: Record<string, number> = {};
  const uniqueWordsCount: Record<string, number> = {};

  for (const p of participants) {
    const totalSent = messageCounts[p] || 0;

    avgMessageLength[p] = totalSent > 0 
      ? Math.round((wordCounts[p] / totalSent) * 10) / 10 
      : 0;

    avgResponseTimes[p] = responseTimeCounts[p] > 0 
      ? Math.round(responseTimeSums[p] / responseTimeCounts[p]) 
      : 0;

    lateNightRatios[p] = totalSent > 0 
      ? Math.round((lateNightCounts[p] / totalSent) * 100) 
      : 0;

    daytimeRatios[p] = totalSent > 0 
      ? Math.round((daytimeCounts[p] / totalSent) * 100) 
      : 0;

    loveSentimentRatios[p] = totalSent > 0 
      ? Math.round((loveSentimentCounts[p] / totalSent) * 100) 
      : 0;

    dryTexts[p] = dryTextCounts[p] || 0;
    args[p] = argumentCounts[p] || 0;
    affection[p] = loveSentimentCounts[p] || 0;
    longTexts[p] = longTextCounts[p] || 0;
    morningTexts[p] = morningTextCounts[p] || 0;
    nightTexts[p] = nightTextCounts[p] || 0;
    uniqueWordsCount[p] = uniqueWordsSet[p].size;

    const emojiList = Object.entries(emojiCounts[p]).map(([emoji, count]) => ({ emoji, count }));
    emojiList.sort((a, b) => b.count - a.count);
    topEmojis[p] = emojiList.slice(0, 5);
  }

  let mostActiveDayStr = 'N/A';
  let maxDayCount = 0;
  for (const [date, count] of Object.entries(dailyActivityCounts)) {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDayStr = date;
    }
  }

  let formattedMostActiveDay = 'N/A';
  if (mostActiveDayStr !== 'N/A') {
    const d = new Date(mostActiveDayStr);
    formattedMostActiveDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Streak calculations
  const sortedDates = Object.keys(dailyActivityCounts).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currDate = new Date(dateStr);
    if (!prevDate) {
      currentStreak = 1;
    } else {
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
    prevDate = currDate;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  let finalCurrentStreak = currentStreak;
  if (prevDate) {
    const today = new Date();
    const diffTime = today.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 2) {
      finalCurrentStreak = 0;
    }
  } else {
    finalCurrentStreak = 0;
  }

  // Relationship duration (V6)
  let daysTogether = 0;
  let relationshipStartDate = "N/A";
  if (sortedDates.length > 0) {
    const startD = new Date(sortedDates[0]);
    const endD = new Date(sortedDates[sortedDates.length - 1]);
    relationshipStartDate = startD.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    daysTogether = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }

  // Interest / Effort balance (V6) - the flagship "who's more into who" verdict
  const effortShare = (a: number, b: number) => {
    const total = a + b;
    return total > 0 ? a / total : 0.5;
  };

  let interestBalance: ChatStats["interestBalance"] = {
    p1Score: 50,
    p2Score: 50,
    moreInvested: "Both equally",
    verdict: "Near-perfect balance — you both put in equal effort. Relationship goals. 💞"
  };

  if (participants.length >= 2) {
    const a = participants[0];
    const b = participants[1];

    const initiationShare = effortShare(initiationCounts[a] || 0, initiationCounts[b] || 0);
    const doubleTextShare = effortShare(doubleTextCounts[a] || 0, doubleTextCounts[b] || 0);
    const affectionShare = effortShare(loveSentimentCounts[a] || 0, loveSentimentCounts[b] || 0);
    const wordShare = effortShare(wordCounts[a] || 0, wordCounts[b] || 0);

    // Faster replies => more invested. The slower person's time gets weighted to the faster person's share.
    const ra = responseTimeCounts[a] > 0 ? responseTimeSums[a] / responseTimeCounts[a] : 0;
    const rb = responseTimeCounts[b] > 0 ? responseTimeSums[b] / responseTimeCounts[b] : 0;
    const speedShare = (ra + rb) > 0 ? rb / (ra + rb) : 0.5;

    const p1Effort = (initiationShare + doubleTextShare + affectionShare + wordShare + speedShare) / 5;
    const p1Score = Math.round(p1Effort * 100);
    const p2Score = 100 - p1Score;

    const diff = Math.abs(p1Score - p2Score);
    const leader = p1Score >= p2Score ? a : b;
    const follower = p1Score >= p2Score ? b : a;

    let moreInvested = "Both equally";
    let verdict = "Near-perfect balance — you both put in equal effort. Relationship goals. 💞";

    if (diff >= 4) {
      moreInvested = leader;
      if (diff >= 24) {
        verdict = `${leader} is carrying this relationship — initiating more, replying faster, and being more affectionate. ${follower} might want to step it up. 👀`;
      } else if (diff >= 12) {
        verdict = `${leader} is noticeably more invested, leading on initiation and warmth while ${follower} plays it a little cooler. 💘`;
      } else {
        verdict = `${leader} leans in slightly more, but honestly it's a pretty balanced match. 💕`;
      }
    }

    interestBalance = { p1Score, p2Score, moreInvested, verdict };
  }

  return {
    participants,
    totalMessages,
    messageCounts,
    wordCounts,
    avgMessageLength,
    doubleTextCounts,
    initiationCounts,
    avgResponseTimes,
    emojiCounts,
    topEmojis,
    hourlyActivity,
    weeklyActivity,
    mostActiveDay: {
      date: formattedMostActiveDay,
      count: maxDayCount,
    },
    longestStreak,
    currentStreak: finalCurrentStreak,
    
    // Premium stats
    longestSilence: {
      duration: Math.round(maxSilenceMs / 1000),
      date: silenceDateStr,
      ignorer: silenceIgnorer
    },
    lateNightRatios,
    daytimeRatios,
    loveSentimentRatios,
    
    redFlags: {
      dryTexts,
      arguments: args
    },
    greenFlags: {
      affection,
      longTexts
    },
    morningTexts,
    nightTexts,
    maxConsecutiveTexts,
    uniqueWordsCount,
    mediaCounts,

    // V5 Premium stats
    monthlyActivity,
    sparkShift: {
      firstPeriodAvg,
      recentPeriodAvg
    },
    petNamesCounts,
    apologyCounts,
    questionCounts,
    vocabularyOverlapPct,

    // V6 conversion stats
    firstILoveYou,
    daysTogether,
    relationshipStartDate,
    interestBalance
  };
}
