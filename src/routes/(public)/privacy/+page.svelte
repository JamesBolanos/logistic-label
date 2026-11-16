<script>
  import { m } from '#lib/paraglide/messages.js';
  const policySections = [
    {
      title: m.privacy_collect(),
      items: [
        m.privacy_item_user_account_information_including_email(),
        m.privacy_item_business_data_you_submit_such_as_labels_(),
        m.privacy_item_usage_data_including_page_navigation_con(),
        m.privacy_item_if_you_use_the_public_request_form_the_c()
      ]
    },
    {
      title: m.privacy_use(),
      items: [
        m.privacy_item_provide_maintain_and_improve_the_label_g(),
        m.privacy_item_authenticate_users_and_protect_account_a(),
        m.privacy_item_reply_to_suggestions_and_tailored_projec(),
        m.privacy_item_temporarily_use_the_source_ip_address_to(),
        m.privacy_item_improve_the_application_and_user_experie(),
        m.privacy_item_meet_legal_security_and_compliance_oblig()
      ]
    },
    {
      title: m.privacy_storage(),
      items: [
        m.privacy_item_access_to_user_and_business_data_is_rest(),
        m.privacy_item_security_measures_are_used_to_protect_ag(),
        m.privacy_item_data_is_stored_in_the_eea_or_jurisdictio()
      ]
    },
    {
      title: m.privacy_sharing(),
      items: [
        m.privacy_item_we_do_not_sell_or_rent_personal_or_busin(),
        m.privacy_item_service_providers_may_process_data_for_h(),
        m.privacy_item_the_transactional_email_provider_process(),
        m.privacy_item_data_may_be_disclosed_where_required_by_()
      ]
    },
    {
      title: m.privacy_rights(),
      items: [
        m.privacy_item_access_correct_or_delete_your_personal_d(),
        m.privacy_item_restrict_or_object_to_certain_processing(),
        m.privacy_item_request_data_portability_or_withdraw_con()
      ]
    },
    {
      title: m.privacy_retention(),
      items: [
        m.privacy_item_public_request_details_are_sent_by_email(),
        m.privacy_item_the_source_ip_used_for_request_throttlin(),
        m.privacy_item_other_data_is_retained_only_as_long_as_n(),
        m.privacy_item_retention_may_be_extended_where_required(),
        m.privacy_item_data_is_securely_deleted_when_it_is_no_l()
      ]
    },
    {
      title: m.privacy_analytics(),
      items: [
        m.privacy_item_google_analytics_is_used_in_production_t(),
        m.privacy_item_analytics_events_exclude_emails_company_(),
        m.privacy_item_configured_owner_accounts_stop_sending_p(),
        m.privacy_item_saved_labels_pdf_responses_browser_downl()
      ]
    }
  ];
</script>

<svelte:head>
  <title>{m.privacy_title()} - GS1-128 Logistic Label Generator</title>
  <meta name="description" content={m.privacy_meta()} />
</svelte:head>

<div class="space-y-8">
  <header class="bg-surface rounded-lg shadow border border-border-default overflow-hidden">
    <div class="px-6 py-8 sm:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <h1 class="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            {m.privacy_heading()}
          </h1>
          <p class="mt-4 text-base leading-7 text-muted-foreground">
            {m.privacy_intro()}
          </p>
          <p class="mt-3 text-sm text-subtle-foreground">{m.privacy_last_updated()}</p>
        </div>

        <div
          class="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-5 py-4 lg:w-72"
        >
          <p class="text-sm font-medium text-blue-900 dark:text-blue-200">Privacy standard</p>
          <p class="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-300">
            Account and label data are handled securely with attention to GDPR and other privacy
            requirements.
          </p>
        </div>
      </div>
    </div>
  </header>

  <section class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
    {#each policySections as section (section.title)}
      <article class="bg-surface rounded-lg shadow border border-border-default overflow-hidden">
        <div class="px-6 py-5 border-b border-border-default">
          <h2 class="text-lg font-medium text-foreground">{section.title}</h2>
        </div>
        <div class="px-6 py-5">
          <ul class="space-y-4">
            {#each section.items as item (item)}
              <li class="flex gap-3 text-sm leading-6 text-muted-foreground">
                <span class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                <span>{item}</span>
              </li>
            {/each}
          </ul>
        </div>
      </article>
    {/each}
  </section>

  <section class="bg-surface rounded-lg shadow border border-border-default overflow-hidden">
    <div class="px-6 py-5 border-b border-border-default sm:px-8">
      <h2 class="text-lg font-medium text-foreground">{m.privacy_contact()}</h2>
      <p class="mt-1 text-sm text-subtle-foreground">
        <a
          class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
          href="mailto:jbolanosdiaz@gmail.com"
        >
          Contact privacy support
        </a>
        with privacy questions or requests related to your data.
      </p>
    </div>
  </section>
</div>
