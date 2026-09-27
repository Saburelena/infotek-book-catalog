import { ROLE_USER } from "./constants.js";
import type {
  AuthorRecord,
  BookRecord,
  DemoUser,
  SubscriptionRecord,
} from "./domain/types.js";

export type {
  AuthorRecord,
  BookRecord,
  DemoUser,
  SubscriptionRecord,
} from "./domain/types.js";

export const DEMO_USER: DemoUser = {
  id: 1,
  username: "user",
  password: "user123",
  role: ROLE_USER,
};

export const authors: AuthorRecord[] = [
  { id: 1, full_name: "Лев Николаевич Толстой" },
  { id: 2, full_name: "Фёдор Михайлович Достоевский" },
  { id: 3, full_name: "Михаил Афанасьевич Булгаков" },
  { id: 4, full_name: "Александр Сергеевич Пушкин" },
  { id: 5, full_name: "Антон Павлович Чехов" },
  { id: 6, full_name: "Николай Васильевич Гоголь" },
  { id: 7, full_name: "Иван Сергеевич Тургенев" },
  { id: 8, full_name: "Борис Леонидович Пастернак" },
  { id: 9, full_name: "Александр Исаевич Солженицын" },
  { id: 10, full_name: "Илья Ильф" },
  { id: 11, full_name: "Евгений Петров" },
  { id: 12, full_name: "Андрей Платонов" },
];

export const books: BookRecord[] = [
  {
    id: 1,
    title: "Война и мир",
    year: 1869,
    description:
      "Эпический роман о русском обществе в эпоху наполеоновских войн: семьи Ростовых, Болконских и Безуховых, Бородино и мысль народная.",
    isbn: "9780140447934",
    cover_url: "/uploads/cover-1.svg",
    author_ids: [1],
  },
  {
    id: 2,
    title: "Анна Каренина",
    year: 1877,
    description:
      "История Анны, Вронского и Левина — роман о любви, семье, общественном мнении и поиске смысла.",
    isbn: "9780140449174",
    cover_url: "/uploads/cover-2.svg",
    author_ids: [1],
  },
  {
    id: 3,
    title: "Преступление и наказание",
    year: 1866,
    description:
      "Петербургский роман о студенте Раскольникове, теории «необыкновенного человека» и цене вины.",
    isbn: "9780140449136",
    cover_url: "/uploads/cover-3.svg",
    author_ids: [2],
  },
  {
    id: 4,
    title: "Идиот",
    year: 1869,
    description:
      "Князь Мышкин возвращается в Россию. Роман о доброте, которая сталкивается с обществом и страстью.",
    isbn: "9780140447019",
    cover_url: "/uploads/cover-4.svg",
    author_ids: [2],
  },
  {
    id: 5,
    title: "Братья Карамазовы",
    year: 1880,
    description:
      "Последний роман Достоевского: отцы и дети, вера и сомнение, суд и легенда о Великом инквизиторе.",
    isbn: "9780374528379",
    cover_url: "/uploads/cover-5.svg",
    author_ids: [2],
  },
  {
    id: 6,
    title: "Мастер и Маргарита",
    year: 1967,
    description:
      "Воланд в Москве, роман о Понтии Пилате и история любви Мастера и Маргариты.",
    isbn: "9780141180144",
    cover_url: "/uploads/cover-6.svg",
    author_ids: [3],
  },
  {
    id: 7,
    title: "Собачье сердце",
    year: 1925,
    description:
      "Профессор Преображенский пересаживает гипофиз дворняге Шарику — сатира на социальный эксперимент.",
    isbn: "9780802150592",
    cover_url: "/uploads/cover-7.svg",
    author_ids: [3],
  },
  {
    id: 8,
    title: "Евгений Онегин",
    year: 1833,
    description:
      "Роман в стихах: столичная скука, деревенская Татьяна, дуэль и письмо, которое слишком поздно.",
    isbn: "9780140448108",
    cover_url: "/uploads/cover-8.svg",
    author_ids: [4],
  },
  {
    id: 9,
    title: "Капитанская дочка",
    year: 1836,
    description:
      "Повесть о Пугачёвском бунте, чести и любви Гринёва и Маши Мироновой.",
    isbn: "9780140447088",
    cover_url: "/uploads/cover-9.svg",
    author_ids: [4],
  },
  {
    id: 10,
    title: "Вишнёвый сад",
    year: 1904,
    description:
      "Последняя пьеса Чехова: продажа имения, несбывшиеся надежды и звук лопнувшей струны.",
    isbn: "9780486411217",
    cover_url: "/uploads/cover-10.svg",
    author_ids: [5],
  },
  {
    id: 11,
    title: "Чайка",
    year: 1896,
    description:
      "Пьеса о театре, тщеславии и любви, с которой начался новый русский театр.",
    isbn: "9780486407951",
    cover_url: "/uploads/cover-11.svg",
    author_ids: [5],
  },
  {
    id: 12,
    title: "Мёртвые души",
    year: 1842,
    description:
      "Чичиков скупает «мёртвые души». Поэма Гоголя о губернской России и человеческих типах.",
    isbn: "9780140448078",
    cover_url: "/uploads/cover-12.svg",
    author_ids: [6],
  },
  {
    id: 13,
    title: "Ревизор",
    year: 1836,
    description:
      "Комедия о чиновниках уездного города, которые приняли Хлестакова за столичного ревизора.",
    isbn: "9780486426259",
    cover_url: "/uploads/cover-13.svg",
    author_ids: [6],
  },
  {
    id: 14,
    title: "Отцы и дети",
    year: 1862,
    description:
      "Роман о Базарове-нигилисте и столкновении поколений в русской усадьбе.",
    isbn: "9780140441475",
    cover_url: "/uploads/cover-14.svg",
    author_ids: [7],
  },
  {
    id: 15,
    title: "Доктор Живаго",
    year: 1957,
    description:
      "Роман о Юрии Живаго, революции, любви и поэзии на сломе эпох.",
    isbn: "9780679774389",
    cover_url: "/uploads/cover-15.svg",
    author_ids: [8],
  },
  {
    id: 16,
    title: "Один день Ивана Денисовича",
    year: 1962,
    description:
      "Один день заключённого Шухова в лагере — повесть, открывшая лагерную тему широкому читателю.",
    isbn: "9780374522896",
    cover_url: "/uploads/cover-16.svg",
    author_ids: [9],
  },
  {
    id: 17,
    title: "Двенадцать стульев",
    year: 1928,
    description:
      "Остап Бендер и Киса Воробьянинов охотятся за бриллиантами мадам Петуховой, спрятанными в стульях.",
    isbn: "9780810114845",
    cover_url: "/uploads/cover-17.svg",
    author_ids: [10, 11],
  },
  {
    id: 18,
    title: "Золотой телёнок",
    year: 1931,
    description:
      "Великий комбинатор снова в деле: погоня за миллионером Корейко.",
    isbn: "9780810115521",
    cover_url: "/uploads/cover-18.svg",
    author_ids: [10, 11],
  },
  {
    id: 19,
    title: "Котлован",
    year: 1930,
    description:
      "Повесть о строительстве общепролетарского дома, которое становится метафорой эпохи.",
    isbn: "9780810111455",
    cover_url: "/uploads/cover-19.svg",
    author_ids: [12],
  },
  {
    id: 20,
    title: "Война и мир. Черновые главы",
    year: 1869,
    description:
      "Черновики и варианты сцен: работа над романом в год его завершения.",
    isbn: "9780140447935",
    cover_url: "/uploads/cover-20.svg",
    author_ids: [1],
  },
];

export const subscriptions: SubscriptionRecord[] = [
  { id: 1, author_id: 3, phone: "79001112233" },
];
