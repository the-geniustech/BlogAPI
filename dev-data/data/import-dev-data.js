import { readFileSync } from 'fs';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import { create, deleteMany } from './../../models/newsModel';

config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await create(tours);
    await __create(users, { validateBeforeSave: false });
    await _create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await deleteMany();
    await __deleteMany();
    await _deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
