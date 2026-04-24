#!/usr/bin/env node
/* eslint-disable */
// Seed realistic reviews on every published course.
// Usage:  MONGODB_URI=mongodb://localhost:27017/trulearnix_qa node scripts/seed-course-reviews.js
// Re-runs are idempotent: courses with >= 25 reviews are skipped.

const mongoose = require('mongoose');

const MUSLIM_GIRL_NAMES = [
  'Aisha Khan', 'Fatima Ahmed', 'Zainab Qureshi', 'Khadija Shaikh', 'Mariam Ansari',
  'Sara Sheikh', 'Nadia Ali', 'Laila Hussain', 'Zara Siddiqui', 'Noor Fatima',
  'Amina Begum', 'Safiya Parveen', 'Ayesha Malik', 'Hafsa Rahman', 'Maryam Pathan',
  'Ruqaya Ali', 'Sumayya Ahmed', 'Aleena Khan', 'Areeba Qureshi', 'Alina Sheikh',
  'Farah Akhtar', 'Ifra Khan', 'Iqra Jahan', 'Mahira Sayyed', 'Sana Ahmed',
  'Tahira Begum', 'Uzma Naaz', 'Yasmin Siddique', 'Rukhsar Ali', 'Shabnam Khatoon',
  'Nikhat Parveen', 'Saira Ansari', 'Nausheen Akhter', 'Mehnaz Bano', 'Naseema Khan',
  'Ishrat Jahan', 'Fariha Rahman', 'Shireen Hussain', 'Rukhsana Begum', 'Saba Siddiqui',
  'Bushra Malik', 'Afifa Khan', 'Samreen Ahmed', 'Saniya Sheikh', 'Hina Qureshi',
  'Nusrat Ansari', 'Ruqia Parveen', 'Zoya Khan', 'Rafia Sayyed', 'Rasheeda Bano',
  'Anjuman Ara', 'Mehak Pathan', 'Shazia Fatima', 'Afreen Sultana', 'Gulnaz Bibi',
  'Hafsana Begum', 'Huma Nigar', 'Kulsum Khan', 'Nazia Parveen', 'Raeesa Malik',
  'Sadiya Kauser', 'Shaheen Bano', 'Tarannum Khan', 'Tabassum Ahmed', 'Uzma Khatoon',
  'Wajiha Sheikh', 'Yusra Akhter', 'Samia Qureshi', 'Nashrah Ali', 'Asma Sayyed',
];

const OTHER_NAMES = [
  'Priya Sharma', 'Divya Patel', 'Anjali Gupta', 'Neha Verma', 'Pooja Reddy',
  'Riya Mehta', 'Kavya Iyer', 'Shruti Nair', 'Ananya Singh', 'Sneha Joshi',
  'Rahul Kumar', 'Vikram Yadav', 'Rohan Das', 'Arjun Menon', 'Aditya Rao',
  'Ishaan Kapoor', 'Kabir Malhotra', 'Aarav Agarwal', 'Dev Saxena', 'Kunal Chauhan',
  'Meera Krishnan', 'Lakshmi Pillai', 'Kritika Mishra', 'Tanvi Desai',
];

const COMMENTS_BY_RATING = {
  5: [
    'Bohot hi accha course hai. Mentor ne sab concepts simple language me samjhaya. Definitely recommend karungi!',
    'Excellent content and live classes! Mujhe pehle kuch nahi aata tha, ab mein confidently projects bana sakti hoon.',
    'Amazing mentor, amazing support. Live doubt clearing sessions se bohot help mili. Highly recommended course!',
    'Zindagi badalne wala course hai. Practical examples aur real projects ne meri skills completely upgrade kar di.',
    'TruLearnix ka best course mene kiya hai. Certificate bhi mila aur skills bhi improve hui. 10/10!',
    'Isse behtar course nahi milega. Course content, delivery, aur support sab top-notch hai. Shukriya team!',
    'Mujhe bohot pasand aaya. Mentor bilkul patient hain aur har question ka jawab dete hain.',
    'Quality of content is outstanding. I learned so much in just a few weeks. Worth every rupee.',
    'Best investment for my career. Already getting freelance projects after finishing this course.',
    'Very well structured. Beginners ke liye perfect hai, step-by-step sab kuch explain kiya gaya hai.',
    'Course complete kar liya aur ab mein apna kaam khud kar sakti hoon. Thank you TruLearnix!',
    'Live classes me maza aata hai. Mentor ki teaching style bohot interactive hai.',
  ],
  4: [
    'Accha course hai overall. Kuch topics aur detail me cover ho sakte the, but mostly helpful.',
    'Good course, learned a lot. Few sections felt rushed but content quality is high.',
    'Mujhe bohot cheezein seekhne ko mili. Thoda aur practice assignments hote to aur better hota.',
    'Worth the price. Mentor is knowledgeable and approachable. Recommended for beginners.',
    'Theek thaak experience. Mentor accha padhate hain, lekin kabhi kabhi pace thoda fast ho jata hai.',
    'Nice course structure and good explanations. Could use more hands-on projects.',
    'Helpful course. Mujhe job interviews me confidence aaya iske baad.',
  ],
  3: [
    'Course is okay, some topics need more clarity. But overall learnt new things.',
    'Average course. Content is fine but I expected more depth in advanced sections.',
    'Theek hai. Beginners ke liye suitable hai, but intermediate learners ko aur challenge chahiye hoga.',
  ],
};

function pickRating() {
  const r = Math.random();
  if (r < 0.60) return 5;
  if (r < 0.90) return 4;
  return 3;
}

function pickName() {
  const useMuslim = Math.random() < 0.70;
  const pool = useMuslim ? MUSLIM_GIRL_NAMES : OTHER_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickComment(rating) {
  const pool = COMMENTS_BY_RATING[rating];
  return pool[Math.floor(Math.random() * pool.length)];
}

function initials(name) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function randomPastDate() {
  const daysAgo = Math.floor(Math.random() * 180) + 1;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('[seed] connected:', uri);

  const Course = mongoose.connection.collection('courses');
  const courses = await Course.find({}, { projection: { _id: 1, title: 1, reviews: 1, ratingCount: 1 } }).toArray();
  console.log(`[seed] found ${courses.length} courses`);

  let updated = 0, skipped = 0;
  for (const c of courses) {
    const existing = (c.reviews || []).length;
    if (existing >= 25) { skipped++; continue; }

    const target = Math.floor(Math.random() * 26) + 25; // 25..50
    const need = target - existing;
    const newReviews = [];
    for (let i = 0; i < need; i++) {
      const rating = pickRating();
      const name = pickName();
      newReviews.push({
        name,
        avatar: initials(name),
        rating,
        comment: pickComment(rating),
        createdAt: randomPastDate(),
      });
    }

    const allReviews = [...(c.reviews || []), ...newReviews];
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await Course.updateOne(
      { _id: c._id },
      { $set: { reviews: allReviews, rating: Number(avg.toFixed(2)), ratingCount: allReviews.length } }
    );
    updated++;
    console.log(`  ✓ ${c.title}: +${need} reviews → ${allReviews.length} total, avg ${avg.toFixed(2)}`);
  }

  console.log(`[seed] done — updated=${updated} skipped=${skipped}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
