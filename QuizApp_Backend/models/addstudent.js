import bcrypt from "bcryptjs";

const passwordPlain = "9850364491"; // your desired password
const hashedPassword = await bcrypt.hash(passwordPlain, 10);

console.log(hashedPassword);
