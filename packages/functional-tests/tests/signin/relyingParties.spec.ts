import { test, expect, newPagesForSync } from '../../lib/fixtures/standard';

test.describe('severity-1 #smoke', () => {
  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293471
  test('signin to sync and disconnect #1293471', async ({
    target,
    credentials,
  }) => {
    const { page, login, settings } = await newPagesForSync(target);

    await page.goto(
      target.contentServerUrl +
        '?context=fx_desktop_v3&entrypoint=fxa%3Aenter_email&service=sync&action=email',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(1000);

    await login.login(credentials.email, credentials.password);

    expect(await login.isSyncConnectedHeader()).toBe(true);

    // Normally we wouldn't need this delay, but because we are
    // disconnecting the sync service, we need to ensure that the device
    // record and web channels have been sent and created.
    await page.waitForTimeout(1000);

    await settings.disconnectSync(credentials);

    expect(page.url()).toMatch(login.url);
  });

  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293475
  test('disconnect RP #1293475', async ({
    browser,
    credentials,
    pages: { relier, login, settings },
    target,
  }, { project }) => {
    await relier.goto();
    await relier.clickEmailFirst();

    await login.login(credentials.email, credentials.password);
    expect(await relier.isLoggedIn()).toBe(true);

    // Login to settings with cached creds
    await settings.goto();

    let services = await settings.connectedServices.services();
    expect(services.length).toEqual(3);

    // Sign out of 123Done
    const rp = services.find((service) => service.name.includes('123'));
    await rp.signout();

    await settings.waitForAlertBar();
    services = await settings.connectedServices.services();
    expect(services.length).toEqual(2);
  });
});

test.describe('severity-3 #smoke', () => {
  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293362
  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293469
  test('can login to addons #1293362 #1293469', async ({
    credentials,
    page,
    pages: { login, settings },
  }, { project }) => {
    test.skip(project.name !== 'production', 'uses prod addons site');
    await page.goto('https://addons.mozilla.org/en-US/firefox/');
    await Promise.all([page.click('text=Log in'), page.waitForNavigation()]);
    await login.login(credentials.email, credentials.password);
    expect(page.url()).toMatch(
      'https://addons.mozilla.org/en-US/firefox/users/edit'
    );
    await page.click('text=Delete My Profile');
    await page.click('button.Button--alert[type=submit]');
    await page.waitForURL('https://addons.mozilla.org/en-US/firefox');
    await settings.goto();
    const services = await settings.connectedServices.services();
    const names = services.map((s) => s.name);
    expect(names?.some((x) => /^Add-ons/.test(x))).toBeTruthy();
  });

  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293352
  test('can login to pocket #1293352', async ({
    credentials,
    page,
    pages: { login },
  }, { project }) => {
    test.fixme(true, 'pocket logout hangs after link clicked');
    test.skip(project.name !== 'production', 'uses prod pocket');
    await page.goto('https://getpocket.com/login');
    await Promise.all([
      page.click('a:has-text("Continue with Firefox")'),
      page.waitForNavigation(),
    ]);
    await login.login(credentials.email, credentials.password);
    expect(page.url()).toMatch('https://getpocket.com/my-list');
    await page.click('[aria-label="Open Account Menu"]');
    await page.click('a:has-text("Log out")');
  });

  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293364
  test('can login to monitor #1293364', async ({
    credentials,
    page,
    pages: { login },
  }, { project }) => {
    test.skip(project.name !== 'production', 'uses prod monitor');
    await page.goto('https://monitor.firefox.com');
    await Promise.all([
      page.click('text=Sign Up for Alerts'),
      page.waitForNavigation(),
    ]);
    await login.login(credentials.email, credentials.password);
    expect(page.url()).toMatch('https://monitor.firefox.com/user/dashboard');
    await page.click('#avatar-wrapper');
    await Promise.all([
      page.click('text=Sign Out'),
      page.waitForNavigation({ waitUntil: 'networkidle' }),
    ]);
    await expect(page.locator('#sign-in-btn')).toBeVisible();
  });

  // https://testrail.stage.mozaws.net/index.php?/cases/view/1293360
  test('can login to SUMO #1293360', async ({
    credentials,
    page,
    pages: { login },
  }, { project }) => {
    test.skip(project.name !== 'production', 'uses prod monitor');
    test.slow();

    await page.goto('https://support.mozilla.org/en-US/');

    await Promise.all([
      page.click('text=Sign In/Up'),
      page.waitForNavigation(),
    ]);
    await Promise.all([
      page.click('text=Continue with Firefox Accounts'),
      page.waitForNavigation(),
    ]);
    await login.login(credentials.email, credentials.password);

    await page.hover('a[href="/en-US/users/auth"]');
    await page.click('text=Sign Out');
    await expect(page.locator('text=Sign In/Up').first()).toBeVisible();
  });
});

test.describe('OAuth and Fx Desktop handshake', () => {
  test('user signed into browser and OAuth login', async ({
    target,
    credentials,
  }) => {
    const { page, login, settings, relier } = await newPagesForSync(target);
    await page.goto(
      target.contentServerUrl +
        '?context=fx_desktop_v3&entrypoint=fxa%3Aenter_email&service=sync&action=email'
    );
    await login.login(credentials.email, credentials.password);
    expect(await login.isSyncConnectedHeader()).toBe(true);

    // Normally we wouldn't need this delay, but because we are
    // disconnecting the sync service, we need to ensure that the device
    // record and web channels have been sent and created.
    await page.waitForTimeout(1000);

    await relier.goto();
    await relier.clickEmailFirst();

    // User can sign in with cached credentials, no password needed.
    await expect(await login.getPrefilledEmail()).toMatch(credentials.email);
    await expect(await login.isCachedLogin()).toBe(true);

    await login.submit();
    expect(await relier.isLoggedIn()).toBe(true);

    await relier.signOut();

    // Attempt to sign back in
    await relier.clickEmailFirst();

    await expect(await login.getPrefilledEmail()).toMatch(credentials.email);
    await expect(await login.isCachedLogin()).toBe(true);

    await login.submit();
    expect(await relier.isLoggedIn()).toBe(true);

    // Disconnect sync otherwise we can have flaky tests.
    await settings.disconnectSync(credentials);

    expect(page.url()).toMatch(login.url);
  });
});
