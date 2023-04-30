const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
            //args is added for Ubuntu. Remove if this gives issue.  
        });

        const page = await browser.newPage()
        const customPage = new CustomPage(page)


        return new Proxy(customPage, {
            get: function(target, property) {
                return customPage[property] || browser[property] || page[property] 
            }
        })
    }

    constructor(page) {
        this.page = page
    }

    async login() {
        const user = await userFactory()
        const { session, sig } = sessionFactory(user)

        await this.page.setCookie({ name: 'session', value: session })
        await this.page.setCookie({ name: 'session.sig', value: sig })
        await this.page.goto('http://localhost:3000/blogs')
        await this.page.waitFor('a[href="/auth/logout"]')
    }

    async getContentsOf(selector) {
        return await this.page.$eval(selector, el => el.innerHTML)
    }

    get(path) {
        // the function inside evaluate is converted to string, so path will not be available and will throw an error. To fix this we pass path as an argument. This argument will be available on the function that is passed to evaluate. Hence _path is passed
        return this.page.evaluate(async (_path) => {
            return fetch(_path,{
                method: 'GET',
                credentials: 'same-origin',
            }).then(res => res.json())
        }, path)
    }

    post(path, data) {
        return  this.page.evaluate(async (_path, _data) => {
            return fetch(_path,{
                method: 'POST',
                credentials: 'same-origin', //We use the same cookies that were set during login
                headers : {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(_data)
               }).then(res => res.json())
        }, path, data)
    }

    execRequests(actions) {
        // returns an array of promises
        return Promise.all(actions.map(({ method, path, data }) => {
            return this[method](path, data)
        }))
    }
}

module.exports = CustomPage