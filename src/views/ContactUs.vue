<template>
  <v-container class="pa-8 bg-background" fluid>
    <v-row justify="center" no-gutters>
      <v-col
        class="d-flex align-center justify-center bg-surface pa-6 pa-sm-12 rounded-t-lg"
        cols="12"
      >
        <v-card class="w-100 bg-surface" flat>
          <v-card-item class="pa-0 mb-6">
            <v-card-title class="text-h4 font-weight-bold text-primary pa-0">
              Get in Touch
            </v-card-title>
            <v-card-subtitle class="text-body-1 pa-0 mt-2 text-medium-emphasis">
              Have questions about memberships, events, or joining the club? We would love to hear
              from you.
            </v-card-subtitle>
          </v-card-item>

          <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
            <v-row>
              <v-col v-if="errorMessage" cols="12">
                <v-alert border="start" color="error" density="comfortable" variant="tonal">
                  {{ errorMessage }}
                </v-alert>
              </v-col>

              <v-col class="py-1" cols="12" sm="6">
                <v-text-field
                  v-model="formData.name"
                  :rules="[(v) => !!v || 'Name is required']"
                  color="primary"
                  label="Full Name"
                  required
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col class="py-1" cols="12" sm="6">
                <v-text-field
                  v-model="formData.email"
                  :rules="[
                    (v) => !!v || 'Email is required',
                    (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
                  ]"
                  color="primary"
                  label="Email Address"
                  required
                  type="email"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col class="py-1" cols="12">
                <v-select
                  v-model="formData.subject"
                  :items="subjectOptions"
                  :rules="[(v) => !!v || 'Please select a topic']"
                  color="primary"
                  label="What is this regarding?"
                  required
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col class="py-1" cols="12">
                <v-textarea
                  v-model="formData.message"
                  :rules="[
                    (v) => !!v || 'Message is required',
                    (v) => (v && v.length >= 10) || 'Message must be at least 10 characters',
                  ]"
                  color="primary"
                  label="Your Message"
                  required
                  variant="outlined"
                ></v-textarea>
              </v-col>

              <v-col class="pt-4" cols="12">
                <v-btn
                  :disabled="!isFormValid"
                  :loading="isSubmitting"
                  block
                  class="font-weight-bold"
                  color="primary"
                  flat
                  size="large"
                  type="submit"
                >
                  Send Message
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <v-card class="w-100" color="transparent" flat>
          <v-card-title class="text-h4 font-weight-bold pa-0 text-surface">
            Club Information
          </v-card-title>

          <v-divider class="mb-8 opacity-10" color="surface"></v-divider>

          <v-row align="center">
            <v-col class="pe-sm-6 mb-4 mb-md-0" cols="12" md="6">
              <div class="d-flex align-start">
                <div>
                  <div class="d-flex align-center ga-2 mb-1">
                    <div class="text-h6 font-weight-bold text-uppercase text-surface">
                      Meeting Schedule
                    </div>
                    <v-icon
                      class="opacity-40"
                      color="surface"
                      icon="mdi-clock-outline"
                    ></v-icon>
                  </div>
                  <div class="text-body-1 font-weight-light text-surface opacity-90 mt-1">
                    Our club meetings occur from September to June on the third Thursday of every
                    month at 7:15pm. In July and August we have no meetings.
                  </div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-responsive :aspect-ratio="4 / 3" class="rounded-lg elevation-2 bg-surface w-100">
                <iframe
                  height="100%"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  src="https://calendar.google.com/calendar/embed?src=6dd4b4e6f943529cc0dc677309d804dc1da233690360da12fe55770e6dfacccf%40group.calendar.google.com&ctz=America%2FEdmonton"
                  style="border: 0"
                  width="100%"
                ></iframe>
              </v-responsive>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>

          <v-row align="center" class="mb-6">
            <v-col class="pe-sm-6 mb-4 mb-md-0" cols="12" md="6">
              <div class="d-flex align-start">
                <div>
                  <div class="d-flex align-center ga-2 mb-1">
                    <div class="text-h6 font-weight-bold text-uppercase text-surface">
                      Monthly Meeting Location
                    </div>
                    <v-icon
                      class="opacity-40"
                      color="surface"
                      icon="mdi-map-marker-outline"
                    ></v-icon>
                  </div>
                  <div class="text-body-1 font-weight-light text-surface opacity-80 mt-1">
                    2715 Dovely Park SE<br />
                    Calgary, AB T2B 3G8
                  </div>
                </div>
              </div>
            </v-col>

            <v-col class="pt-4" cols="12" md="6">
              <v-responsive :aspect-ratio="16 / 9" class="rounded-lg elevation-2 bg-surface w-100">
                <iframe
                  height="100%"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2510.46337199581!2d-113.98565502347209!3d51.00755914639906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53717a6fc2ee1ccb%3A0xe67dbbe8d7ffbd87!2s2715%20Dovely%20Park%20SE%2C%20Calgary%2C%20AB%20T2B%203G8!5e0!3m2!1sen!2sca!4v1710000000000!5m2!1sen!2sca"
                  style="border: 0; filter: grayscale(30%) sepia(25%)"
                  width="100%"
                ></iframe>
              </v-responsive>
            </v-col>
          </v-row>

          <v-divider class="my-6 opacity-10" color="surface"></v-divider>

          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between pt-2"
          >
            <div class="mb-3 mb-sm-0">
              <div class="text-caption font-weight-bold text-uppercase opacity-60 text-surface">
                Social Media
              </div>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                color="surface"
                href="#"
                icon="mdi-facebook"
                target="_blank"
                variant="text"
              ></v-btn>
              <v-btn
                color="surface"
                href="#"
                icon="mdi-instagram"
                target="_blank"
                variant="text"
              ></v-btn>
              <v-btn
                color="surface"
                href="#"
                icon="mdi-twitter"
                target="_blank"
                variant="text"
              ></v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="showSnackbar" color="success" timeout="4000">
      Message sent successfully! We'll get back to you soon.
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

defineOptions({ name: 'ContactUs' })

const form = ref<InstanceType<typeof import('vuetify/components').VForm> | null>(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)
const showSnackbar = ref(false)
const errorMessage = ref('')

const subjectOptions = ['Membership Inquiry', 'Events', 'General Inquiry']

const formData = reactive({
  name: '',
  email: '',
  subject: null as string | null,
  message: '',
})

const handleSubmit = async () => {
  if (!isFormValid.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await fetch('https://formspree.io/f/xrpbgrek', {
      method: 'POST',
      mode: 'no-cors',
      body: (() => {
        const data = new FormData()
        data.append('name', formData.name)
        data.append('email', formData.email)
        data.append('subject', formData.subject ?? '')
        data.append('message', formData.message)
        return data
      })(),
    })

    showSnackbar.value = true
    form.value?.reset()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send your message.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
