/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import AppLayout from './index';
import { Meta } from '@storybook/react';

export default {
  title: 'Components/AppLayout',
  component: AppLayout,
} as Meta;

export const Basic = () => (
  <AppLayout>
    <h1 className="card-header">Header content</h1>
    <p className="mt-2">Paragraph content here</p>
  </AppLayout>
);
