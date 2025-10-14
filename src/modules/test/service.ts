import type { Test, TestResponse } from './schemas.js';

import type { ServiceResponse } from '@/types/service.js';
import { addTwoNumbers } from '@/utils/index.js';

async function getTestData(data: Test): Promise<ServiceResponse<TestResponse>> {
	logger.info('Received test data', { data });
	const result = addTwoNumbers(1, 2);

	return { message: 'Test data retrieved successfully!', data: { result } };
}

export const TestService = {
	getTestData,
};
