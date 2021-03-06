import { createResponse, ConvoyrResponse } from '@convoyr/core';
import { isServerOrUnknownError } from './is-server-or-unknown-error';

describe.each<[ConvoyrResponse, boolean]>([
  [
    createResponse({
      status: 0,
      statusText: 'Unknown Error',
    }),
    true,
  ],
  [
    createResponse({
      status: 200,
      statusText: 'Ok',
    }),
    false,
  ],
])('isServerOrUnknownError with response: %p => %p', (response, expected) => {
  it('should check if the response is a server or an unknown error', () => {
    expect(isServerOrUnknownError(response)).toBe(expected);
  });
});
