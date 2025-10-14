import z from 'zod';

export const TestSchema = z.object({
	data: z.any(),
});
export type Test = z.infer<typeof TestSchema>;

export const TestResponseSchema = z.object({
	result: z.number(),
});
export type TestResponse = z.infer<typeof TestResponseSchema>;
