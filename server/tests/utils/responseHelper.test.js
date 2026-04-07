import { describe, it, expect } from 'vitest';
import { sendSuccess, sendError } from '../../utils/responseHelper.js';

describe('Response Helper Utils', () => {
  it('sendSuccess should return standard structured response', () => {
    // Mock the Express response object (res)
    const res = {
      statusValue: null,
      jsonValue: null,
      status(code) {
        this.statusValue = code;
        return this; // res.status(200).json(...) chainable
      },
      json(obj) {
        this.jsonValue = obj;
      }
    };

    // Try using the function
    const sampleData = { id: 1, name: 'Tawan' };
    sendSuccess(res, sampleData, 'Test success', 201);

    // Verify properties
    expect(res.statusValue).toBe(201);
    expect(res.jsonValue).toEqual({
      status: 'success',
      message: 'Test success',
      data: sampleData
    });
  });

  it('sendError should return standard error structure', () => {
    const res = {
      statusValue: null,
      jsonValue: null,
      status(code) {
        this.statusValue = code;
        return this;
      },
      json(obj) {
        this.jsonValue = obj;
      }
    };

    sendError(res, 'Test error message', 400);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue).toEqual({
      status: 'error',
      message: 'Test error message'
    });
  });
});
