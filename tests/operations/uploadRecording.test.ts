import { execute } from '../../nodes/SpikyAi/operations/uploadRecording';

// Mock GenericFunctions so we can intercept spikyApiRequest calls
jest.mock('../../nodes/SpikyAi/GenericFunctions', () => ({
	spikyApiRequest: jest.fn(),
}));

import { spikyApiRequest } from '../../nodes/SpikyAi/GenericFunctions';

const mockSpikyApiRequest = spikyApiRequest as jest.MockedFunction<typeof spikyApiRequest>;

function createMockContext(params: Record<string, unknown> = {}) {
	return {
		getNodeParameter: jest.fn((name: string) => params[name] ?? ''),
		getCredentials: jest.fn().mockResolvedValue({
			corePlatformBaseUrl: 'https://core.example.com/prod',
			platformBaseUrl: 'https://platform.example.com/prod',
			idToken: 'test-token',
		}),
		getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
		helpers: { httpRequest: jest.fn() },
		logger: { error: jest.fn(), debug: jest.fn() },
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('uploadRecording', () => {
	beforeEach(() => {
		mockSpikyApiRequest.mockReset();
	});

	const defaultParams = {
		recordingUrl: 'https://example.com/recording.mp4',
		meetingName: 'Test Meeting',
		meetingDate: '2026-03-01T10:00:00Z',
		tags: '',
	};

	function setupDefaultMocks() {
		// Step 1: calculate_call_chunks
		mockSpikyApiRequest.mockResolvedValueOnce({ parts: 3 });
		// Step 3: meeting-reports
		mockSpikyApiRequest.mockResolvedValueOnce({
			meetingAnalysis: {
				id: 'meeting-123',
				meetingName: 'Test Meeting',
				meetingDate: '2026-03-01T10:00:00.000Z',
			},
			s3UploadURL: {
				uploadURLs: [
					['https://s3.example.com/part1', 1],
					['https://s3.example.com/part2', 2],
					['https://s3.example.com/part3', 3],
				],
				completeUploadURL: 'https://s3.example.com/complete',
			},
		});
		// Step 4: upload_call_recording
		mockSpikyApiRequest.mockResolvedValueOnce({ status: true });
	}

	it('should call calculate_call_chunks with the recording URL', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		await execute(ctx, 0);

		expect(mockSpikyApiRequest).toHaveBeenCalledWith(
			'POST',
			'/zapier/calculate_call_chunks',
			'corePlatform',
			{ body: { record_url: 'https://example.com/recording.mp4' } },
		);
	});

	it('should create meeting report with correct fields', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		await execute(ctx, 0);

		expect(mockSpikyApiRequest).toHaveBeenCalledWith(
			'POST',
			'/platform/meeting-reports',
			'platform',
			expect.objectContaining({
				meetingName: 'Test Meeting',
				meetingDate: '2026-03-01T10:00:00.000Z',
				uploadPartCount: 3,
				integrationName: 'N8N',
			}),
		);
	});

	it('should call upload_call_recording with recording URL and s3UploadURL', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		await execute(ctx, 0);

		expect(mockSpikyApiRequest).toHaveBeenCalledWith(
			'POST',
			'/zapier/upload_call_recording',
			'corePlatform',
			expect.objectContaining({
				body: {
					record_url: 'https://example.com/recording.mp4',
					meeting: {
						s3UploadURL: expect.objectContaining({
							uploadURLs: expect.any(Array),
							completeUploadURL: 'https://s3.example.com/complete',
						}),
					},
				},
			}),
		);
	});

	it('should return meeting_id, meeting_name, meeting_date, and status', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		const result = await execute(ctx, 0);

		expect(result).toEqual({
			meeting_id: 'meeting-123',
			meeting_name: 'Test Meeting',
			meeting_date: '2026-03-01T10:00:00.000Z',
			status: 'upload_in_progress',
		});
	});

	it('should default meetingDate to now when not provided', async () => {
		setupDefaultMocks();
		const ctx = createMockContext({ ...defaultParams, meetingDate: '' });

		const before = new Date().toISOString();
		await execute(ctx, 0);
		const after = new Date().toISOString();

		const meetingReportsCall = mockSpikyApiRequest.mock.calls.find(
			(call) => call[1] === '/platform/meeting-reports',
		);
		const body = meetingReportsCall![3] as Record<string, unknown>;
		const date = body.meetingDate as string;

		expect(date >= before).toBe(true);
		expect(date <= after).toBe(true);
	});

	it('should not include tags field when tags input is empty', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		await execute(ctx, 0);

		const meetingReportsCall = mockSpikyApiRequest.mock.calls.find(
			(call) => call[1] === '/platform/meeting-reports',
		);
		const body = meetingReportsCall![3] as Record<string, unknown>;
		expect(body.tags).toBeUndefined();
	});

	describe('tag resolution', () => {
		it('should match existing tags by name (case-insensitive)', async () => {
			// Step 1: calculate_call_chunks
			mockSpikyApiRequest.mockResolvedValueOnce({ parts: 2 });
			// Step 2: GET /platform/tags
			mockSpikyApiRequest.mockResolvedValueOnce([
				{ id: 'tag-aaa', tagName: 'Sales' },
				{ id: 'tag-bbb', tagName: 'Demo' },
			]);
			// Step 3: meeting-reports
			mockSpikyApiRequest.mockResolvedValueOnce({
				meetingAnalysis: { id: 'm-1', meetingName: 'M', meetingDate: '2026-01-01' },
				s3UploadURL: { uploadURLs: [], completeUploadURL: '' },
			});
			// Step 4: upload_call_recording
			mockSpikyApiRequest.mockResolvedValueOnce({ status: true });

			const ctx = createMockContext({ ...defaultParams, tags: 'sales, DEMO' });

			await execute(ctx, 0);

			const meetingReportsCall = mockSpikyApiRequest.mock.calls.find(
				(call) => call[1] === '/platform/meeting-reports',
			);
			const body = meetingReportsCall![3] as Record<string, unknown>;
			expect(body.tags).toEqual(['tag-aaa', 'tag-bbb']);
		});

		it('should create tags that do not exist', async () => {
			// Step 1: calculate_call_chunks
			mockSpikyApiRequest.mockResolvedValueOnce({ parts: 1 });
			// Step 2: GET /platform/tags (empty — no existing tags)
			mockSpikyApiRequest.mockResolvedValueOnce([]);
			// Step 2b: POST /platform/tags (create "newtag")
			mockSpikyApiRequest.mockResolvedValueOnce({ id: 'tag-new', tagName: 'newtag' });
			// Step 3: meeting-reports
			mockSpikyApiRequest.mockResolvedValueOnce({
				meetingAnalysis: { id: 'm-2', meetingName: 'M', meetingDate: '2026-01-01' },
				s3UploadURL: { uploadURLs: [], completeUploadURL: '' },
			});
			// Step 4: upload_call_recording
			mockSpikyApiRequest.mockResolvedValueOnce({ status: true });

			const ctx = createMockContext({ ...defaultParams, tags: 'newtag' });

			await execute(ctx, 0);

			expect(mockSpikyApiRequest).toHaveBeenCalledWith(
				'POST',
				'/platform/tags',
				'platform',
				{ tagName: 'newtag' },
			);
		});

		it('should limit tags to 3', async () => {
			// Step 1: calculate_call_chunks
			mockSpikyApiRequest.mockResolvedValueOnce({ parts: 1 });
			// Step 2: GET /platform/tags
			mockSpikyApiRequest.mockResolvedValueOnce([
				{ id: 't1', tagName: 'a' },
				{ id: 't2', tagName: 'b' },
				{ id: 't3', tagName: 'c' },
				{ id: 't4', tagName: 'd' },
			]);
			// Step 3: meeting-reports
			mockSpikyApiRequest.mockResolvedValueOnce({
				meetingAnalysis: { id: 'm-3', meetingName: 'M', meetingDate: '2026-01-01' },
				s3UploadURL: { uploadURLs: [], completeUploadURL: '' },
			});
			// Step 4: upload_call_recording
			mockSpikyApiRequest.mockResolvedValueOnce({ status: true });

			const ctx = createMockContext({ ...defaultParams, tags: 'a, b, c, d' });

			await execute(ctx, 0);

			const meetingReportsCall = mockSpikyApiRequest.mock.calls.find(
				(call) => call[1] === '/platform/meeting-reports',
			);
			const body = meetingReportsCall![3] as Record<string, unknown>;
			expect((body.tags as string[]).length).toBe(3);
		});
	});

	it('should make API calls in the correct order', async () => {
		setupDefaultMocks();
		const ctx = createMockContext(defaultParams);

		await execute(ctx, 0);

		const endpoints = mockSpikyApiRequest.mock.calls.map((call) => call[1]);
		expect(endpoints).toEqual([
			'/zapier/calculate_call_chunks',
			'/platform/meeting-reports',
			'/zapier/upload_call_recording',
		]);
	});
});
