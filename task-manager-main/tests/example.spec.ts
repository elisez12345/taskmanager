import { test, expect } from '@playwright/test';


test('user flow 1', async ({page}) => {
  await page.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=testuser&role=admin');
  await page.getByRole('link', { name: 'Teams' }).click();
  await page.getByLabel('Team Name').click();
  await page.getByLabel('Team Name').fill('Test Team');
  await page.getByRole('button', { name: 'Create Team' }).click();
  await expect(page.getByRole('heading')).toContainText('Test Team');

  await page.getByRole('link', { name: 'TaskBoards' }).click();
  await page.getByPlaceholder('Task Board Title').click();
  await page.getByPlaceholder('Task Board Title').fill('Test Board');

  await page.getByLabel('Enter Member Names (comma-').click();
  await page.getByLabel('Enter Member Names (comma-').fill('adduser');
  await page.getByRole('button', { name: 'Create Task Board' }).click();

  await expect(page.locator('h3')).toContainText('Test Board');
  await page.getByPlaceholder('Task title').click();
  await page.getByPlaceholder('Task title').fill('Test Task');
  await page.getByRole('button', { name: 'Add Task' }).click();
  // await expect(page.locator('h2')).toContainText('Task Boards for testinguser');
  await page.getByRole('link', { name: 'Teams' }).click();
  await expect(page.getByRole('heading')).toContainText('Test Team');

  await expect(page.getByRole('paragraph')).toContainText('Number of Members: 1');
  await page.getByPlaceholder('Enter member name').click();
  await page.getByPlaceholder('Enter member name').fill('user2');
  await page.getByRole('button', { name: 'Add Member' }).click();
  await expect(page.getByRole('paragraph')).toContainText('Number of Members: 2');
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('link', { name: 'TaskBoards' }).click();
  await page.getByRole('button', { name: 'Delete Task Board' }).click();
});
