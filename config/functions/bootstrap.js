module.exports = async () => {
  // const namespaces = ["main", "footer"];
  const namespaces = strapi.config.get(
    "custom.plugins.navigation.namespaces"
  ) || ["main"];

  // Check if the plugin users-permissions is installed because the navigation needs it
  if (Object.keys(strapi.plugins).indexOf("users-permissions") === -1) {
    throw new Error(
      "In order to make the navigation plugin work the users-permissions plugin is required"
    );
  }

  // Add permissions
  const actions = [
    {
      section: "plugins",
      displayName: "Access the Navigation",
      uid: "read",
      pluginName: "navigation",
    },
    {
      section: "plugins",
      displayName: "Ability to change the Navigation",
      uid: "update",
      pluginName: "navigation",
    },
  ];

  const locales = (await strapi.plugins.i18n.services.locales.find()).reduce(
    (orig, locale) => {
      return orig.concat(
        namespaces.map((name) => ({
          code: locale.code,
          slug: `${name}`.toLowerCase(),
          name: `${name} (${locale.code})`,
        }))
      );
    },
    []
  );

  const navigations = await strapi.query("navigation", "navigation").find();

  await Promise.all(
    locales
      .filter((locale) => !navigations.map((i) => i.slug).includes(locale.slug))
      .map(async (locale) => {
        const item = await strapi.plugins.navigation.services.navigation.post({
          name: locale.name,
          visible: true,
        });

        return await strapi.query("navigation", "navigation").update(
          { _id: item.id },
          {
            locale: locale.code,
            slug: locale.slug,
          }
        );
      })
  );

  const { actionProvider } = strapi.admin.services.permission;
  await actionProvider.registerMany(actions);
};
