/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { getFtlBundle, testL10n } from 'fxa-react/lib/test-utils';
import { FluentBundle } from '@fluent/bundle';
import SigninConfirmed from '.';
import { logViewEvent, usePageViewEvent } from '../../lib/metrics';

jest.mock('../../lib/metrics', () => ({
  logViewEvent: jest.fn(),
  usePageViewEvent: jest.fn(),
}));

describe('SigninConfirmed', () => {
  let bundle: FluentBundle;
  beforeAll(async () => {
    bundle = await getFtlBundle('settings');
  });
  it('renders Ready component as expected', () => {
    render(<SigninConfirmed />);
    const ftlMsgMock = screen.getAllByTestId('ftlmsg-mock')[1];
    testL10n(ftlMsgMock, bundle, {
      serviceName: 'Account Settings',
    });

    const signinConfirmation = screen.getByText('Sign-in confirmed');
    const serviceAvailabilityConfirmation = screen.getByText(
      'You’re now ready to use Account Settings'
    );
    const signinContinueButton = screen.queryByText('Continue');
    // Calling `getByText` will fail if these elements aren't in the document,
    // but we test anyway to make the intention of the test explicit
    expect(signinContinueButton).not.toBeInTheDocument();
    expect(signinConfirmation).toBeInTheDocument();
    expect(serviceAvailabilityConfirmation).toBeInTheDocument();
  });

  it('emits the expected metrics on render', () => {
    render(<SigninConfirmed />);
    expect(usePageViewEvent).toHaveBeenCalledWith('signin-confirmed', {
      entrypoint_variation: 'react',
    });
  });

  it('emits the expected metrics when a user clicks `Continue`', () => {
    render(
      <SigninConfirmed
        continueHandler={() => {
          console.log('beepboop');
        }}
      />
    );
    const passwordResetContinueButton = screen.getByText('Continue');

    fireEvent.click(passwordResetContinueButton);
    expect(logViewEvent).toHaveBeenCalledWith(
      'signin-confirmed',
      'signin-confirmed.continue',
      {
        entrypoint_variation: 'react',
      }
    );
  });
});
