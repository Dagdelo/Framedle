<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { inviteUser } = useAdmin()

const formEmail = ref('')
const formName = ref('')
const formRole = ref<'user' | 'admin'>('user')
const saving = ref(false)
const success = ref<string | null>(null)
const error = ref<string | null>(null)

async function handleSubmit() {
  if (!formEmail.value.trim()) {
    error.value = 'Email is required'
    return
  }

  saving.value = true
  success.value = null
  error.value = null

  try {
    const res = await inviteUser(
      formEmail.value.trim(),
      formName.value.trim() || undefined,
      formRole.value,
    )

    if (res.error) {
      error.value = res.error.message
    } else {
      success.value = `Invitation sent to ${formEmail.value}`
      formEmail.value = ''
      formName.value = ''
      formRole.value = 'user'
    }
  } catch {
    error.value = 'Failed to send invitation'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/users" class="text-zinc-400 hover:text-white transition-colors text-sm">
        ← Users
      </NuxtLink>
      <h1 class="text-2xl font-bold">Invite User</h1>
    </div>

    <div class="max-w-md">
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 class="font-semibold text-white mb-4">Send Invitation</h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Email address <span class="text-red-400">*</span></label>
            <input
              v-model="formEmail"
              type="email"
              placeholder="user@example.com"
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Display name <span class="text-zinc-500">(optional)</span></label>
            <input
              v-model="formName"
              type="text"
              placeholder="John Doe"
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Role</label>
            <select
              v-model="formRole"
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div v-if="success" class="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
            {{ success }}
          </div>
          <div v-if="error" class="text-sm text-red-400">{{ error }}</div>

          <button
            type="submit"
            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white text-sm font-medium rounded-md transition-colors"
            :disabled="saving"
          >
            {{ saving ? 'Sending...' : 'Send Invitation' }}
          </button>
        </form>
      </div>

      <p class="mt-4 text-xs text-zinc-500">
        Invitations are sent via Logto. The user will receive an email with a link to create their account.
        Admin role grants access to this dashboard.
      </p>
    </div>
  </div>
</template>
