import { createSearchBlob, normalizeTags } from '@/lib/services/book-utils';
import type { Book, CirculationTransaction, Role, UserProfile } from '@/lib/types';

const ISO_DAY = 24 * 60 * 60 * 1000;

interface BookBlueprint {
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  tags: string[];
  isbn?: string;
  description?: string;
  coverUrl?: string;
  aiSummary?: string;
  aiSuggestedGenre?: string;
}

interface SeedUserBlueprint {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

interface TransactionPlan {
  bookId: string;
  memberUid: string;
  memberName: string;
  timeline: Array<
    | {
        action: 'checkout';
        createdAt: string;
        dueDate: string;
        actorUid: string;
        actorName: string;
      }
    | {
        action: 'checkin';
        createdAt: string;
        actorUid: string;
        actorName: string;
      }
  >;
}

export interface SeedDataset {
  users: UserProfile[];
  books: Book[];
  circulationTransactions: CirculationTransaction[];
}

const USER_BLUEPRINTS: SeedUserBlueprint[] = [
  {
    uid: 'seed-admin-001',
    email: 'seed-admin@mlms.demo',
    displayName: 'Seed Admin',
    role: 'admin',
  },
  {
    uid: 'seed-member-001',
    email: 'seed-member-001@mlms.demo',
    displayName: 'Seed Member One',
    role: 'member',
  },
  {
    uid: 'seed-member-002',
    email: 'seed-member-002@mlms.demo',
    displayName: 'Seed Member Two',
    role: 'member',
  },
  {
    uid: 'seed-member-003',
    email: 'seed-member-003@mlms.demo',
    displayName: 'Seed Member Three',
    role: 'member',
  },
];

const BOOK_BLUEPRINTS: BookBlueprint[] = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Software Engineering',
    publishedYear: 2008,
    tags: ['engineering', 'best practices', 'refactoring'],
    isbn: '9780132350884',
    description: 'A practical handbook for writing readable, maintainable software.',
    aiSummary: 'A practical reference on writing readable and maintainable software in teams.',
    aiSuggestedGenre: 'Software Engineering',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    genre: 'Software Engineering',
    publishedYear: 1999,
    tags: ['career', 'craftsmanship', 'engineering'],
    isbn: '9780201616224',
    description: 'Timeless advice for pragmatic decision-making in software projects.',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    genre: 'Distributed Systems',
    publishedYear: 2017,
    tags: ['distributed systems', 'databases', 'architecture'],
    isbn: '9781449373320',
    description: 'Foundational patterns for storage, stream processing, and system reliability.',
    aiSummary: 'A modern guide to reliable data systems and distributed architecture patterns.',
    aiSuggestedGenre: 'Distributed Systems',
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    genre: 'Software Engineering',
    publishedYear: 2018,
    tags: ['refactoring', 'code quality', 'patterns'],
    isbn: '9780134757599',
    description: 'Techniques for improving existing codebases without changing behavior.',
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    genre: 'Productivity',
    publishedYear: 2016,
    tags: ['productivity', 'focus', 'career'],
    isbn: '9781455586691',
    description: 'Strategies for high-value focused work in distracted environments.',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self Improvement',
    publishedYear: 2018,
    tags: ['habits', 'behavior', 'self improvement'],
    isbn: '9780735211292',
    description: 'A framework for building sustainable habits through tiny changes.',
  },
  {
    title: 'The Phoenix Project',
    author: 'Gene Kim',
    genre: 'Business Fiction',
    publishedYear: 2013,
    tags: ['devops', 'operations', 'leadership'],
    isbn: '9780988262591',
    description: 'A narrative introduction to DevOps and IT operations transformation.',
  },
  {
    title: 'Accelerate',
    author: 'Nicole Forsgren',
    genre: 'Technology Management',
    publishedYear: 2018,
    tags: ['devops', 'metrics', 'delivery'],
    isbn: '9781942788331',
    description: 'Research-driven practices that improve software delivery performance.',
    aiSummary: 'Research-backed strategies linking engineering practices to business outcomes.',
    aiSuggestedGenre: 'Technology Management',
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    genre: 'Entrepreneurship',
    publishedYear: 2011,
    tags: ['startup', 'experimentation', 'product'],
    isbn: '9780307887894',
    description: 'Build-measure-learn loops for product discovery under uncertainty.',
  },
  {
    title: 'Cracking the Coding Interview',
    author: 'Gayle Laakmann McDowell',
    genre: 'Interview Prep',
    publishedYear: 2015,
    tags: ['interviews', 'algorithms', 'career'],
    isbn: '9780984782857',
    description: 'Problem patterns and strategies for technical interviews.',
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    publishedYear: 2015,
    tags: ['history', 'anthropology', 'society'],
    isbn: '9780062316097',
    description: 'A broad history of humankind from ancient to modern eras.',
  },
  {
    title: 'Homo Deus',
    author: 'Yuval Noah Harari',
    genre: 'Futurology',
    publishedYear: 2017,
    tags: ['future', 'technology', 'society'],
    isbn: '9780062464316',
    description: 'Possible futures shaped by biotechnology, AI, and data.',
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    genre: 'Memoir',
    publishedYear: 2018,
    tags: ['memoir', 'education', 'family'],
    isbn: '9780399590504',
    description: 'A memoir about education, resilience, and personal transformation.',
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Contemporary Fiction',
    publishedYear: 2020,
    tags: ['fiction', 'life choices', 'mental health'],
    isbn: '9780525559474',
    description: 'A story exploring alternate lives and the meaning of regret.',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Science Fiction',
    publishedYear: 2021,
    tags: ['space', 'science fiction', 'survival'],
    isbn: '9780593135204',
    description: 'A lone astronaut must solve an extinction-level crisis.',
    aiSummary: 'A high-stakes space survival story driven by science and ingenuity.',
    aiSuggestedGenre: 'Science Fiction',
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    publishedYear: 1965,
    tags: ['politics', 'desert', 'epic'],
    isbn: '9780441172719',
    description: 'An epic saga of power, prophecy, and ecology on Arrakis.',
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    publishedYear: 1937,
    tags: ['fantasy', 'adventure', 'classic'],
    isbn: '9780547928227',
    description: 'Bilbo Baggins embarks on an unexpected adventure.',
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    genre: 'Fantasy',
    publishedYear: 2007,
    tags: ['fantasy', 'magic', 'coming of age'],
    isbn: '9780756404741',
    description: 'A legendary arcanist recounts his life story.',
  },
  {
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    genre: 'Thriller',
    publishedYear: 2012,
    tags: ['thriller', 'mystery', 'psychology'],
    isbn: '9780307588371',
    description: 'A marriage mystery unfolds through conflicting narratives.',
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    genre: 'Thriller',
    publishedYear: 2019,
    tags: ['thriller', 'psychological', 'mystery'],
    isbn: '9781250301697',
    description: 'A psychotherapist investigates a famous patient who stopped speaking.',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    genre: 'Psychology',
    publishedYear: 2011,
    tags: ['psychology', 'decision making', 'behavioral science'],
    isbn: '9780374533557',
    description: 'A deep exploration of cognitive biases and human judgment.',
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    genre: 'Finance',
    publishedYear: 2020,
    tags: ['finance', 'behavior', 'investing'],
    isbn: '9780857197689',
    description: 'Stories and lessons about money behavior over pure math.',
  },
  {
    title: 'Zero to One',
    author: 'Peter Thiel',
    genre: 'Business',
    publishedYear: 2014,
    tags: ['startup', 'business', 'innovation'],
    isbn: '9780804139298',
    description: 'A startup-focused perspective on building unique businesses.',
  },
  {
    title: 'Measure What Matters',
    author: 'John Doerr',
    genre: 'Management',
    publishedYear: 2018,
    tags: ['okr', 'management', 'execution'],
    isbn: '9780525536222',
    description: 'How OKRs align teams around measurable outcomes.',
  },
  {
    title: 'Hooked',
    author: 'Nir Eyal',
    genre: 'Product Design',
    publishedYear: 2014,
    tags: ['product', 'behavior design', 'growth'],
    isbn: '9781591847786',
    description: 'Framework for building habit-forming products.',
  },
  {
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    genre: 'Design',
    publishedYear: 2013,
    tags: ['design', 'ux', 'usability'],
    isbn: '9780465050659',
    description: 'Principles for creating understandable, human-centered designs.',
  },
  {
    title: 'Sprint',
    author: 'Jake Knapp',
    genre: 'Product',
    publishedYear: 2016,
    tags: ['product', 'design sprint', 'teamwork'],
    isbn: '9781501121746',
    description: 'A five-day process for solving product problems quickly.',
  },
  {
    title: 'Inspired',
    author: 'Marty Cagan',
    genre: 'Product Management',
    publishedYear: 2017,
    tags: ['product management', 'teams', 'discovery'],
    isbn: '9781119387503',
    description: 'How successful product teams build products users love.',
  },
  {
    title: 'The Goal',
    author: 'Eliyahu M. Goldratt',
    genre: 'Operations',
    publishedYear: 1984,
    tags: ['operations', 'constraints', 'process improvement'],
    isbn: '9780884271956',
    description: 'A business novel introducing the theory of constraints.',
  },
  {
    title: 'Never Split the Difference',
    author: 'Chris Voss',
    genre: 'Negotiation',
    publishedYear: 2016,
    tags: ['negotiation', 'communication', 'leadership'],
    isbn: '9780062407801',
    description: 'Negotiation tactics from former FBI hostage negotiator Chris Voss.',
  },
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function dayShiftIso(baseNow: Date, dayOffset: number): string {
  return new Date(baseNow.getTime() + dayOffset * ISO_DAY).toISOString();
}

function pickMember(index: number, users: UserProfile[]): { uid: string; displayName: string } {
  const members = users.filter((user) => user.role === 'member');
  const member = members[index % members.length];
  if (!member) {
    throw new Error('No seed members are available');
  }

  return {
    uid: member.uid,
    displayName: member.displayName,
  };
}

function buildUsers(nowIso: string): UserProfile[] {
  return USER_BLUEPRINTS.map((blueprint, index) => {
    const createdAt = new Date(
      new Date(nowIso).getTime() - (220 - index * 12) * ISO_DAY,
    ).toISOString();

    return {
      uid: blueprint.uid,
      email: blueprint.email,
      displayName: blueprint.displayName,
      role: blueprint.role,
      createdAt,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
  });
}

function buildBaseBooks(now: Date, users: UserProfile[]): Book[] {
  const adminUser = users.find((user) => user.role === 'admin');
  if (!adminUser) {
    throw new Error('Admin seed user is required');
  }

  return BOOK_BLUEPRINTS.map((blueprint, index) => {
    const id = `book-${String(index + 1).padStart(3, '0')}`;
    const tags = normalizeTags(blueprint.tags);
    const createdAt = dayShiftIso(now, -(180 - index * 2));

    return {
      id,
      title: blueprint.title,
      author: blueprint.author,
      isbn: blueprint.isbn,
      genre: blueprint.genre,
      publishedYear: blueprint.publishedYear,
      coverUrl: blueprint.coverUrl,
      description: blueprint.description,
      aiSummary: blueprint.aiSummary,
      aiSuggestedGenre: blueprint.aiSuggestedGenre,
      tags,
      searchBlob: createSearchBlob({
        title: blueprint.title,
        author: blueprint.author,
        genre: blueprint.genre,
        isbn: blueprint.isbn,
        tags,
      }),
      availability: 'available',
      createdAt,
      updatedAt: createdAt,
      createdByUid: adminUser.uid,
      updatedByUid: adminUser.uid,
    };
  });
}

function buildTransactionPlans(now: Date, users: UserProfile[]): TransactionPlan[] {
  const adminUser = users.find((user) => user.role === 'admin');
  if (!adminUser) {
    throw new Error('Admin seed user is required');
  }

  const checkedOutBookIds = Array.from(
    { length: 12 },
    (_, index) => `book-${String(index + 1).padStart(3, '0')}`,
  );
  const availableCycleBookIds = ['book-013', 'book-014'];

  const overdueDueOffsets = [-8, -6, -5, -3, -1];
  const activeDueOffsets = [7, 9, 11, 13, 15, 18, 21];

  const plans: TransactionPlan[] = [];

  checkedOutBookIds.forEach((bookId, index) => {
    const member = pickMember(index, users);
    const isOverdue = index < 5;
    const dueOffset = isOverdue ? overdueDueOffsets[index] : activeDueOffsets[index - 5];
    const finalCheckoutCreatedAt = dayShiftIso(now, -(18 - index));
    const finalDueDate = dayShiftIso(now, dueOffset);

    const actorIsMember = index % 2 === 0;
    const checkoutActor = actorIsMember
      ? { uid: member.uid, displayName: member.displayName }
      : { uid: adminUser.uid, displayName: adminUser.displayName };
    const checkinActor = { uid: adminUser.uid, displayName: adminUser.displayName };

    if (index < 4) {
      plans.push({
        bookId,
        memberUid: member.uid,
        memberName: member.displayName,
        timeline: [
          {
            action: 'checkout',
            createdAt: finalCheckoutCreatedAt,
            dueDate: finalDueDate,
            actorUid: checkoutActor.uid,
            actorName: checkoutActor.displayName,
          },
        ],
      });
      return;
    }

    if (index < 8) {
      const previousCheckout = dayShiftIso(now, -(58 - index));
      const previousCheckin = dayShiftIso(now, -(44 - index));
      plans.push({
        bookId,
        memberUid: member.uid,
        memberName: member.displayName,
        timeline: [
          {
            action: 'checkout',
            createdAt: previousCheckout,
            dueDate: dayShiftIso(now, -(42 - index)),
            actorUid: checkoutActor.uid,
            actorName: checkoutActor.displayName,
          },
          {
            action: 'checkin',
            createdAt: previousCheckin,
            actorUid: checkinActor.uid,
            actorName: checkinActor.displayName,
          },
          {
            action: 'checkout',
            createdAt: finalCheckoutCreatedAt,
            dueDate: finalDueDate,
            actorUid: checkoutActor.uid,
            actorName: checkoutActor.displayName,
          },
        ],
      });
      return;
    }

    const checkoutA = dayShiftIso(now, -(92 - index));
    const checkinA = dayShiftIso(now, -(78 - index));
    const checkoutB = dayShiftIso(now, -(56 - index));
    const checkinB = dayShiftIso(now, -(40 - index));

    plans.push({
      bookId,
      memberUid: member.uid,
      memberName: member.displayName,
      timeline: [
        {
          action: 'checkout',
          createdAt: checkoutA,
          dueDate: dayShiftIso(now, -(70 - index)),
          actorUid: checkoutActor.uid,
          actorName: checkoutActor.displayName,
        },
        {
          action: 'checkin',
          createdAt: checkinA,
          actorUid: checkinActor.uid,
          actorName: checkinActor.displayName,
        },
        {
          action: 'checkout',
          createdAt: checkoutB,
          dueDate: dayShiftIso(now, -(34 - index)),
          actorUid: checkoutActor.uid,
          actorName: checkoutActor.displayName,
        },
        {
          action: 'checkin',
          createdAt: checkinB,
          actorUid: checkinActor.uid,
          actorName: checkinActor.displayName,
        },
        {
          action: 'checkout',
          createdAt: finalCheckoutCreatedAt,
          dueDate: finalDueDate,
          actorUid: checkoutActor.uid,
          actorName: checkoutActor.displayName,
        },
      ],
    });
  });

  availableCycleBookIds.forEach((bookId, index) => {
    const member = pickMember(index + 1, users);
    const checkoutCreatedAt = dayShiftIso(now, -(36 - index * 2));
    const checkinCreatedAt = dayShiftIso(now, -(24 - index * 2));

    plans.push({
      bookId,
      memberUid: member.uid,
      memberName: member.displayName,
      timeline: [
        {
          action: 'checkout',
          createdAt: checkoutCreatedAt,
          dueDate: dayShiftIso(now, -(14 - index)),
          actorUid: adminUser.uid,
          actorName: adminUser.displayName,
        },
        {
          action: 'checkin',
          createdAt: checkinCreatedAt,
          actorUid: member.uid,
          actorName: member.displayName,
        },
      ],
    });
  });

  return plans;
}

function buildTransactionsFromPlans(
  booksById: Map<string, Book>,
  plans: TransactionPlan[],
): CirculationTransaction[] {
  const transactions: CirculationTransaction[] = [];

  for (const plan of plans) {
    const book = booksById.get(plan.bookId);
    if (!book) {
      throw new Error(`Missing book for transaction plan: ${plan.bookId}`);
    }

    for (const event of plan.timeline) {
      transactions.push({
        id: '',
        bookId: book.id,
        bookTitle: book.title,
        action: event.action,
        memberUid: plan.memberUid,
        memberName: plan.memberName,
        actorUid: event.actorUid,
        actorName: event.actorName,
        dueDate: event.action === 'checkout' ? event.dueDate : undefined,
        createdAt: event.createdAt,
      });
    }
  }

  transactions.sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  return transactions.map((transaction, index) => ({
    ...transaction,
    id: `tx-${String(index + 1).padStart(3, '0')}`,
  }));
}

function applyTransactionsToBooks(
  baseBooks: Book[],
  transactions: CirculationTransaction[],
): Book[] {
  const booksById = new Map(baseBooks.map((book) => [book.id, { ...book }]));

  for (const transaction of transactions) {
    const book = booksById.get(transaction.bookId);
    if (!book) {
      throw new Error(`Transaction references unknown book: ${transaction.bookId}`);
    }

    if (transaction.action === 'checkout') {
      book.availability = 'checked_out';
      book.borrowedByUid = transaction.memberUid;
      book.borrowedByName = transaction.memberName;
      book.borrowedAt = transaction.createdAt;
      book.dueDate = transaction.dueDate;
      book.updatedAt = transaction.createdAt;
      book.updatedByUid = transaction.actorUid;
      continue;
    }

    book.availability = 'available';
    delete book.borrowedByUid;
    delete book.borrowedByName;
    delete book.borrowedAt;
    delete book.dueDate;
    book.updatedAt = transaction.createdAt;
    book.updatedByUid = transaction.actorUid;
  }

  return baseBooks.map((book) => {
    const updated = booksById.get(book.id);
    if (!updated) {
      throw new Error(`Failed to resolve seeded book ${book.id}`);
    }

    return updated;
  });
}

function validateDataset(dataset: SeedDataset, referenceNow: Date): void {
  assert(dataset.users.length === 4, 'Seed dataset must include exactly 4 users');
  assert(dataset.books.length === 30, 'Seed dataset must include exactly 30 books');
  assert(
    dataset.circulationTransactions.length === 40,
    'Seed dataset must include exactly 40 circulation transactions',
  );

  const userIds = new Set(dataset.users.map((user) => user.uid));
  const bookIds = new Set(dataset.books.map((book) => book.id));

  for (const transaction of dataset.circulationTransactions) {
    assert(bookIds.has(transaction.bookId), `Unknown transaction.bookId ${transaction.bookId}`);
    assert(
      userIds.has(transaction.memberUid),
      `Unknown transaction.memberUid ${transaction.memberUid}`,
    );
    assert(
      userIds.has(transaction.actorUid),
      `Unknown transaction.actorUid ${transaction.actorUid}`,
    );
  }

  const checkedOutBooks = dataset.books.filter((book) => book.availability === 'checked_out');
  const availableBooks = dataset.books.filter((book) => book.availability === 'available');
  assert(checkedOutBooks.length === 12, 'Seed dataset must leave exactly 12 books checked out');
  assert(availableBooks.length === 18, 'Seed dataset must leave exactly 18 books available');

  const nowMs = referenceNow.getTime();
  const overdueCount = checkedOutBooks.filter((book) => {
    if (!book.dueDate) {
      return false;
    }

    return new Date(book.dueDate).getTime() < nowMs;
  }).length;
  assert(overdueCount === 5, 'Seed dataset must leave exactly 5 overdue checked-out books');
}

export function buildSeedDataset(now: Date = new Date()): SeedDataset {
  const nowIso = now.toISOString();
  const users = buildUsers(nowIso);
  const baseBooks = buildBaseBooks(now, users);
  const booksById = new Map(baseBooks.map((book) => [book.id, book]));
  const plans = buildTransactionPlans(now, users);
  const circulationTransactions = buildTransactionsFromPlans(booksById, plans);
  const books = applyTransactionsToBooks(baseBooks, circulationTransactions);

  const dataset: SeedDataset = {
    users,
    books,
    circulationTransactions,
  };

  validateDataset(dataset, now);
  return dataset;
}
