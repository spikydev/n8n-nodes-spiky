import { spikyApiRequest } from '../nodes/SpikyAi/GenericFunctions';

describe('spikyApiRequest', () => {
	const mockHttpRequestWithAuthentication = jest.fn();
	const mockLogger = { error: jest.fn(), debug: jest.fn() };

	function createContext(overrides: {
		corePlatformBaseUrl?: string;
		platformBaseUrl?: string;
	} = {}) {
		const {
			corePlatformBaseUrl = 'https://core.example.com/prod',
			platformBaseUrl = 'https://platform.example.com/prod',
		} = overrides;

		return {
			getCredentials: jest.fn().mockResolvedValue({
				corePlatformBaseUrl,
				platformBaseUrl,
			}),
			getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
			helpers: { httpRequestWithAuthentication: mockHttpRequestWithAuthentication },
			logger: mockLogger,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
	}

	beforeEach(() => {
		mockHttpRequestWithAuthentication.mockReset();
		mockLogger.error.mockReset();
	});

	describe('URL construction', () => {
		it('should use corePlatformBaseUrl for corePlatform baseUrlKey', async () => {
			const ctx = createContext({ corePlatformBaseUrl: 'https://core-api.example.com/prod' });
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({
					url: 'https://core-api.example.com/prod/n8n/subscription',
				}),
			);
		});

		it('should use platformBaseUrl for platform baseUrlKey', async () => {
			const ctx = createContext({ platformBaseUrl: 'https://platform-api.example.com/prod' });
			mockHttpRequestWithAuthentication.mockResolvedValue([]);

			await spikyApiRequest.call(ctx, 'GET', '/platform/n8n/meeting-report', 'platform');

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({
					url: 'https://platform-api.example.com/prod/platform/n8n/meeting-report',
				}),
			);
		});

		it('should strip trailing slashes from base URL', async () => {
			const ctx = createContext({ corePlatformBaseUrl: 'https://api.example.com/prod///' });
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({
					url: 'https://api.example.com/prod/n8n/subscription',
				}),
			);
		});
	});

	describe('authentication', () => {
		it('should use httpRequestWithAuthentication with spikyAiApi credential', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.any(Object),
			);
		});

		it('should not set Authorization header manually', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			const options = mockHttpRequestWithAuthentication.mock.calls[0][1];
			expect(options.headers).toBeUndefined();
		});
	});

	describe('request options', () => {
		it('should include body when provided', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue({});
			const body = { hookUrl: 'https://n8n.example.com/webhook' };

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform', body);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({ body }),
			);
		});

		it('should not include body when empty', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'GET', '/test', 'corePlatform', {});

			const options = mockHttpRequestWithAuthentication.mock.calls[0][1];
			expect(options.body).toBeUndefined();
		});

		it('should include query string when provided', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue([]);
			const qs = { limit: '10' };

			await spikyApiRequest.call(ctx, 'GET', '/test', 'platform', undefined, qs);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({ qs }),
			);
		});

		it('should set json: true', async () => {
			const ctx = createContext();
			mockHttpRequestWithAuthentication.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'GET', '/test', 'corePlatform');

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'spikyAiApi',
				expect.objectContaining({ json: true }),
			);
		});
	});

	describe('error handling', () => {
		it('should log and rethrow on HTTP failure', async () => {
			const ctx = createContext();
			const error = Object.assign(new Error('Unauthorized'), { statusCode: 401 });
			mockHttpRequestWithAuthentication.mockRejectedValue(error);

			await expect(
				spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform'),
			).rejects.toThrow('Unauthorized');

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('POST'),
				expect.objectContaining({ statusCode: 401 }),
			);
		});
	});
});
