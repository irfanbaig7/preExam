// Demo data: 1 admin, 1 student, 1 subject, 4 approved papers with tagged questions.
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Paper = require('./models/Paper');
const Question = require('./models/Question');

const BANK = {
  'Linked Lists': { years: [2021, 2022, 2023, 2024], qs: ['Explain singly linked list insertion and deletion with algorithm.', 'Write a program to reverse a linked list.', 'Compare array and linked list representation of data.', 'Explain doubly circular linked list with a neat example.'] },
  'Binary Trees': { years: [2021, 2022, 2023, 2024], qs: ['Construct a binary search tree from the given keys and show inorder traversal.', 'Explain AVL tree rotations with an example.', 'Write recursive algorithms for preorder and postorder traversal.', 'Explain threaded binary tree and its advantages.'] },
  'Sorting': { years: [2021, 2022, 2023, 2024], qs: ['Explain quick sort with an example and derive its average time complexity.', 'Write the merge sort algorithm and compare it with heap sort.', 'Differentiate between stable and unstable sorting algorithms.', 'Sort the given list using radix sort and show each pass.'] },
  'Stacks': { years: [2021, 2022, 2023, 2024], qs: ['Convert the given infix expression to postfix using a stack.', 'Explain stack ADT and list its applications.', 'Evaluate the given postfix expression using a stack.', 'Implement two stacks in a single array.'] },
  'Queues': { years: [2021, 2022, 2024], qs: ['Explain circular queue with insertion and deletion operations.', 'Describe priority queue and its implementation using heap.', 'Explain double ended queue with applications.'] },
  'Graph Traversal': { years: [2022, 2023, 2024], qs: ['Explain BFS and DFS with an example graph.', 'Find the shortest path using Dijkstra algorithm for the given graph.', 'Explain minimum spanning tree using Prim and Kruskal methods.'] },
  'Hashing': { years: [2021, 2023], qs: ['Explain collision resolution techniques in hashing.', 'Insert the given keys in a hash table using linear probing.'] },
  'Complexity Analysis': { years: [2022, 2024], qs: ['Explain Big O, Omega and Theta notations with examples.', 'Calculate the time complexity of the given nested loop code.'] },
};

async function main() {
  await connectDB();

  const mkUser = async (name, email, password, role) => {
    const existing = await User.findOne({ email });
    if (existing) return existing;
    return User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
  };
  const admin = await mkUser('Admin', env.ADMIN_EMAIL, 'Admin@123', 'admin');
  await mkUser('Demo Student', 'demo@pyq.local', 'Demo@1234', 'student');

  const subject = await Subject.findOneAndUpdate(
    { university: 'Demo University', code: 'CS201' },
    { name: 'Data Structures', code: 'CS201', university: 'Demo University', semester: 3, createdBy: admin._id },
    { upsert: true, new: true }
  );

  for (const year of [2021, 2022, 2023, 2024]) {
    const paper = await Paper.findOneAndUpdate(
      { subject: subject._id, year, examType: 'regular' },
      { uploadedBy: admin._id, moderation: 'approved', status: 'ready' },
      { upsert: true, new: true }
    );
    await Question.deleteMany({ paper: paper._id });
    const docs = [];
    let n = 1;
    Object.entries(BANK).forEach(([topic, { years, qs }]) => {
      if (!years.includes(year)) return;
      docs.push({
        paper: paper._id, subject: subject._id, year, number: n++, topic, approved: true,
        text: qs[(year + topic.length) % qs.length],
        marks: [5, 7, 10][(n + year) % 3],
        difficulty: ['easy', 'medium', 'hard'][(n + year) % 3],
      });
    });
    await Question.insertMany(docs);
    paper.questionCount = docs.length;
    await paper.save();
  }

  console.log('Seeded. Logins:');
  console.log(`  admin   ${env.ADMIN_EMAIL} / Admin@123`);
  console.log('  student demo@pyq.local / Demo@1234');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
