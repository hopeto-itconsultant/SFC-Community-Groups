export const MIN_PASSWORD_LENGTH = 6;

/** Returns an error message, or null if the password is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

// Short, everyday words that are easy to spell and to read out over the phone.
// 4 to 6 letters each, so generated passwords are 8 to 10 characters.
const WORDS = [
  "Apple", "Mango", "Lemon", "Grape", "Peach", "Melon", "Guava", "Olive", "Berry", "Cherry",
  "Banana", "Papaya", "Plum", "Pear", "Kiwi", "Lime", "Orange", "Raisin", "Almond", "Walnut",
  "Tiger", "Eagle", "Horse", "Zebra", "Panda", "Koala", "Otter", "Whale", "Camel", "Robin",
  "Parrot", "Falcon", "Rabbit", "Turtle", "Beaver", "Bison", "Moose", "Puppy", "Kitten", "Lamb",
  "Deer", "Goose", "Swan", "Heron", "Finch", "Pigeon", "Llama", "Pony", "Duck", "Bunny",
  "River", "Ocean", "Lake", "Valley", "Meadow", "Forest", "Island", "Beach", "Hill", "Cloud",
  "Rain", "Snow", "Storm", "Breeze", "Sunny", "Spring", "Summer", "Autumn", "Winter", "Shore",
  "Lotus", "Maple", "Coral", "Daisy", "Tulip", "Lily", "Rose", "Orchid", "Cedar", "Willow",
  "Pine", "Palm", "Fern", "Clover", "Bamboo", "Garden", "Flower", "Petal", "Acorn", "Birch",
  "Blue", "Green", "Golden", "Silver", "Purple", "Amber", "Ruby", "Pearl", "Jade", "Ivory",
  "Candle", "Bridge", "Castle", "Harbor", "Window", "Basket", "Pillow", "Kettle", "Teapot", "Ribbon",
  "Violin", "Guitar", "Piano", "Flute", "Drum", "Banjo", "Harp", "Bell", "Melody", "Choir",
  "Rocket", "Planet", "Comet", "Star", "Moon", "Sunset", "Light", "Dawn", "Spark", "Glow",
  "Honey", "Bread", "Butter", "Cookie", "Muffin", "Pepper", "Ginger", "Mint", "Cocoa", "Toffee",
  "Happy", "Brave", "Gentle", "Kind", "Joyful", "Bright", "Calm", "Swift", "Lucky", "Cheer",
] as const;

// Symbols with a short spoken name ("at", "hash", ...) that are on every phone keyboard.
const SYMBOLS = ["@", "#", "$", "&", "*", "!"] as const;

/** Uniform random integer in [0, max), without modulo bias. */
function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/** A capitalised simple word, a symbol and 3 digits, e.g. "Mango@482". */
export function generatePassword(): string {
  return `${WORDS[randomInt(WORDS.length)]}${SYMBOLS[randomInt(SYMBOLS.length)]}${100 + randomInt(900)}`;
}
