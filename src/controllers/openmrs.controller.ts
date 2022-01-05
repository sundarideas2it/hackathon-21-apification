import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {post, requestBody, response} from '@loopback/rest';
import puppeteer from 'puppeteer';
import {SessionRepository} from '../repositories';
import {
	WebhookService
} from '../services';
import config from './../config.json';
import {CreateRequestBody, FindRequestBody} from './specs/webautomation-controller.specs';

export class OpenmrsController {
	constructor(
		@repository(SessionRepository)
		public sessionRepository: SessionRepository,
		@service() public webhookService: WebhookService
	) { }

	/**
	 * Find a patient
	 * @return Object
	 */
	@post('/openmrs/task/find-patient')
	@response(200, {
		description: 'Find a patient',
	})

	async findPatient(
		@requestBody(FindRequestBody) request: {
			guid: string;
			patient_id: string
		},
	): Promise<any> {
		process.on('unhandledRejection', (reason, p) => {
			console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
		});
		this.runFindAsync(request);
		return {guid: request.guid, message: 'Web automation in parallel!', 'status': 200};;
	}

	/**
	 * Find a patient in asyncronous mode
	 * @param req - request object
	 */
	async runFindAsync(req: any): Promise<any> {
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
			return {message: 'Invalid session', 'status': 400};
		}
		await page.waitForTimeout(1000);
		// await page.goto(config.openmrs.patient_url, {waitUntil: 'load'});
		await page.click("#coreapps-activeVisitsHomepageLink-coreapps-activeVisitsHomepageLink-extension");
		await page.waitForSelector('#patient-search');

		if (await page.$('#patient-search') === null) {
			browser.disconnect();
			const errInfo = {
				appname: 'openmrs',
				webhook_url: browserObj.webhook_url,
				err: {
					message: 'Search field not found',
					'status': 404
				}
			};
			await this.webhookService.logError(errInfo);
			return {message: 'Search field not found', 'status': 404};

		}

		await page.type('#patient-search', req.patient_id);
		await page.waitForTimeout(1000);
		await page.click('#patient-search-results-table > tbody > tr > td:nth-child(1)');
		await page.waitForSelector('#coreapps-showContactInfo');
		await page.waitForTimeout(1000);
		let diagnoses = await page.waitForSelector("#coreapps-diagnosesList > div.info-body");//#coreapps-diagnosesList > div.info-body
		diagnoses = await page.evaluate(name => name.innerText, diagnoses);

		// let vitals = await page.waitForSelector("#most-recent-encounter-container1619-");
		// vitals = await page.evaluate(name => name.innerText, vitals);

		// let appointments = await page.waitForSelector("#content > div.dashboard.clear.row > div.col-12.col-lg-9 > div > div:nth-child(1) > div:nth-child(6) > div.info-body");
		// appointments = await page.evaluate(name => name.innerText, appointments)

		const patient_dtls = {
			id: req.patient_id,
			diagnoses
		}
		const patientInfo = {appname: 'openmrs', patient_details: patient_dtls, webhook_url: browserObj.webhook_url};
		await this.webhookService.findPatient(patientInfo);
		if (await page.$('#patient-search-results-table_info') !== null) {
			await page.waitForTimeout(1000);
			await page.screenshot({path: 'LoginExist.png'});
		}
		browser.disconnect();
	}

	/**
	 * Create a patient
	 * @return Object
	 */
	@post('/openmrs/task/create-patient')
	@response(200, {
		description: 'Create a patient',
	})

	async createPatient(
		@requestBody(CreateRequestBody) request: {
			guid: string;
			name: string;
			family_name: string;
			gender: string;
			birthdate: string;
			birthmonth: string;
			birthyear: string;
			address: string;
			city: string;
			state: string;
			country: string;
			postal_code: string;
			phone_no: string
		},
	): Promise<any> {
		const browserObj = await this.sessionRepository.findById(request.guid);
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
		this.runCreateAsync(request);

		const info = {
			appname: 'openmrs',
			webhook_url: browserObj.webhook_url,
			info: {
				message: 'Patient will be created!',
				'status': 400
			}
		};
		await this.webhookService.info(info);
		return {message: 'Patient will be created!', 'status': 200};
	}

	/**
	 * Create a patient in asyncronous mode
	 * @param req - request object
	 */
	async runCreateAsync(req: any): Promise<any> {
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
			return {message: 'Invalid session', 'status': 400};
		}
		await page.waitForTimeout(1000);

		await page.click('#referenceapplication-registrationapp-registerPatient-homepageLink-referenceapplication-registrationapp-registerPatient-homepageLink-extension');
		let inputElement = await page.waitForXPath("//input[@name='givenName']");
		await inputElement?.type(req.name)
		inputElement = await page.waitForXPath("//input[@name='familyName']");
		await inputElement?.type(req.family_name)
		await page.click('#next-button');

		await page.waitForSelector('#gender-field')
		await page.select('select#gender-field', req.gender)
		await page.click('#next-button');

		await page.waitForSelector('#birthdateDay-field')
		await page.click('#birthdateDay-field');
		await page.type('#birthdateDay-field', req.birthdate);
		await page.type('#birthdateMonth-field', req.birthmonth);
		await page.type('#birthdateYear-field', req.birthyear);
		await page.click('#next-button');

		await page.waitForSelector('#address1')
		await page.type('#address1', req.address);
		await page.type('#cityVillage', req.city);
		await page.type('#stateProvince', req.state);
		await page.type('#country', req.country);
		await page.type('#postalCode', req.postal_code);
		await page.click('#next-button');

		inputElement = await page.waitForXPath("//input[@name='phoneNumber']");
		await inputElement?.type(req.phone_no)
		await page.click('#next-button');
		// await page.select('select#relationship_type', req.relationship_type)
		await page.click('#next-button');
		await page.click('#submit');

		const patientIdElem = await page.waitForXPath("//*[@id='content']/div[6]/div[2]/div/span");
		const patientId = await page.evaluate(name => name.innerText, patientIdElem);
		const patientInfo = {
			appname: 'openmrs',
			patient_id: patientId,
			patient_name: `${req.name} ${req.family_name}`,
			webhook_url: browserObj.webhook_url
		};
		await this.webhookService.createPatient(patientInfo);
		browser.disconnect();
	}
}
