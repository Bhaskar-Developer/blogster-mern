const Page = require('./helpers/page')

let page;

// This will run just before each test cases
beforeEach(async () => {
  page = await Page.build()
  await page.goto('http://localhost:3000')
})

// This will run after each test cases
afterEach(async () => {
  await page.close()
})


test('the header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo')
  expect(text).toEqual("Blogster")
}, 50000)

test('clicking login starts the oauth flow', async () => {
  await page.click('.right a');
  const url = await page.url()
  expect(url).toMatch(/accounts\.google\.com/)
}, 50000)

test('when signed in, shows logout button', async () => {
  await page.login()
  const text = await page.getContentsOf('a[href="/auth/logout"]')
  expect(text).toEqual('Logout')
}, 50000)