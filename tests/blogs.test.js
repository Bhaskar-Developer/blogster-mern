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

describe('When logged in', async () => {
    beforeEach(async () => {
        await page.login()
        await page.click('a.btn-floating')
    })

    // nested tests
    test('can see blog create form', async () => {
        const label = await page.getContentsOf('form label')
        expect(label).toEqual('Blog Title')
    })

    describe('And using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title')
            await page.type('.content input', 'My Content')
            await page.click('form button')
        })
        
        test('Submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('h5')
            expect(text).toEqual("Please confirm your entries")
        })

        test('Submitting then saving adds blog to index page', async () => {
            await page.click('button.green')
            // Note: Every test creates a new user, so after blog is created there will only be one blog, so we dont need to do any filer search!

            // Wait for Selector to load
            // We wait for index page to load with the selector
            await page.waitFor('.card')

            const title = await page.getContentsOf('.card-title')
            const content = await page.getContentsOf('p')

            expect(title).toEqual('My Title')
            expect(content).toEqual('My Content')
        })
    })

    describe('And using invalid inputs', async () => {
        beforeEach(async () => {
            // click submit button without entering details. This case the error messages to be generated
            await page.click('form button')
        })
        test('the form shows an error message', async () => {
            // pull error messages and make sure they show the message
            const titleError = await page.getContentsOf('.title .red-text')
            
            const contentError = await page.getContentsOf('.content .red-text')

            expect(titleError).toEqual('You must provide a value')
            expect(contentError).toEqual('You must provide a value')
        })
    }) 
})


describe('User is not logged in', async () => {
    const actions = [
        {
            method: 'get',
            path: '/api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'T',
                content: 'C'
            }
        }
    ]

    test('blogs related actions are prohibited', async () => {
        const results =  await page.execRequests(actions)
        // This result will be an array of objects each with error field
        for(let result of results) {
            expect(result).toEqual({ error: 'You must log in!' })
        }
    })
})