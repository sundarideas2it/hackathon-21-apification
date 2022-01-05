// Uncomment these imports to begin using these cool features!
// import {inject} from '@loopback/core';
import {service} from '@loopback/core';
import {
	repository
} from '@loopback/repository';
import {post, requestBody, response} from '@loopback/rest';
import puppeteer from 'puppeteer';
import {SessionRepository} from '../repositories';
import {
	WebhookService
} from '../services';
import config from './../config.json';
import {ConcurrentRequestBody, CreateSessionResObj, CredentialsRequestBody} from './specs/webautomation-controller.specs';
export class WebautomationController {
	constructor(
		@repository(SessionRepository)
		public sessionRepository: SessionRepository,
		@service() public webhookService: WebhookService
	) { }

	/**
	 * Start the new session for web automation
	 * @return Object - session object
	 */
	@post('/create-session')
	@response(200, {
		description: 'Create session',
	})
	async create(
		@requestBody(CredentialsRequestBody) credential: {
			appname: string;
			username: string;
			password: string;
			webhook_url: string;
		},
	): Promise<CreateSessionResObj> {
		const browser = await puppeteer.launch({
			headless: false,
			ignoreHTTPSErrors: true,
			args: [`--window-size=1920,967`]
		});
		const browserWSEndpoint = browser.wsEndpoint();
		const autoId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const sessionObj = {
			"id": autoId,
			"browser": browserWSEndpoint,
			"webhook_url": credential.webhook_url
		}
		const session = await this.sessionRepository.create(sessionObj);
		const page = (await browser.pages())[0];
		await page.setViewport({width: 1920, height: 967});
		await page.goto(config.openmrs.base_url, {waitUntil: 'load'});

		await page.type('#username', credential.username);
		await page.type('#password', credential.password);
		await page.waitForSelector('li[id="Registration Desk"]');
		await page.click('li[id="Registration Desk"]');

		await page.click('#loginButton');
		await page.screenshot({path: 'Login.png'});
		browser.disconnect();
		return {guid: autoId, message: 'Session created successfully!', 'status': 200};
	}

	@post('/destroy-session')
	@response(200, {
		description: 'Logout the given session',
	})
	async destroy(
		@requestBody(ConcurrentRequestBody) credential: {
			guid: string;
		},
	): Promise<any> {
		const browserObj = await this.sessionRepository.findById(credential.guid);
		process.on('unhandledRejection', async (reason, p) => {
			const errInfo = {
				appname: 'openmrs',
				webhook_url: browserObj.webhook_url,
				err: {
					message: `Unhandled Rejection at: Promise, ${p}, reason:, ${reason}`,
					'status': 400
				}
			};
			await this.webhookService.logError(errInfo);
			console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
		});
		this.close(credential);
		const info = {
			appname: 'openmrs',
			webhook_url: browserObj.webhook_url,
			info: {
				message: 'Session will be destroyed!',
				'status': 200
			}
		};
		await this.webhookService.info(info);
		return {message: 'Session will be destroyed!', 'status': 200};
	}

	/**
	 * logout and close the browser application
	 * @param req - request object
	 */
	async close(req: any): Promise<any> {
		const browserObj = await this.sessionRepository.findById(req.guid);
		const browser = await puppeteer.connect({
			browserWSEndpoint: browserObj.browser,
		});

		const page = (await browser.pages())[0];
		await page.setViewport({width: 1920, height: 967});
		await page.goto(config.openmrs.base_url, {waitUntil: 'load'});
		if (await page.$('#username') !== null) {
			browser.disconnect();
			const errInfo = {
				appname: 'openmrs',
				webhook_url: browserObj.webhook_url,
				err: {
					message: 'Invalid session',
					'status': 400
				}
			};
			await this.webhookService.logError(errInfo);
			return {message: 'Invalid session.', 'status': 400};
		}
		// if (await page.$('button[class="navbar-toggler"]') !== null) {
		// 	await page.click('button[class="navbar-toggler"]');
		// }
		if (await page.$('li[class="nav-item logout"]') === null) {
			browser.disconnect();
			const errInfo = {
				appname: 'openmrs',
				webhook_url: browserObj.webhook_url,
				err: {
					message: 'logout option not found.',
					'status': 404
				}
			};
			await this.webhookService.logError(errInfo);
			return {message: 'logout option not found.', 'status': 404};
		}
		await page.click(config.openmrs.logout_btn);
		await page.screenshot({path: 'logout.png'});
		await this.sessionRepository.deleteById(req.guid);
		browser.close();
	}

}
