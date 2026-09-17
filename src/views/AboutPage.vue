<template>
  <v-container class="pa-4 pa-sm-8 bg-background" fluid>
    <v-row justify="center" no-gutters>
      <v-col class="bg-surface pa-6 pa-sm-12 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item class="pa-0 mb-6">
            <v-card-title class="text-h4 font-weight-black text-primary pa-0">
              About Us
            </v-card-title>
          </v-card-item>

          <v-card-text class="pa-0 text-body-1 text-on-surface">
            <v-row class="mb-2" align="center">
              <v-col class="pe-md-6 mb-4 mb-md-0" cols="12" md="6">
                <p class="mb-4">
                  Welcome to the Rocky Mountain Garden Railroaders (RMGR)! We are a passionate
                  community of G-Gauge model railroaders based in
                  <span class="font-weight-medium text-primary">Calgary, Alberta, Canada</span>.
                  What started as a group of friends in the late 1980s has grown into a vibrant,
                  family-focused club of approximately 35 member families who build, operate, and
                  display large-scale railways—both indoors and out.
                </p>
                <p class="mb-0">
                  Our mission is to promote the hobby of large-scale model railroading, support one
                  another's creative efforts, and share the joy of trains with the broader
                  community.
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <div class="content-image-frame elevation-4">
                  <img
                    :src="highlightImage"
                    alt="RMGR garden railway highlight"
                    class="content-image"
                  />
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-6 opacity-10"></v-divider>

            <v-row class="mt-2">
              <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
                <div class="text-h6 font-weight-bold text-primary mb-2">What We Do</div>
                <p class="mb-3">Garden railroading is a multidisciplinary hobby that blends:</p>

                <div
                  v-for="(item, index) in whatWeDoList"
                  :key="index"
                  class="d-flex align-center mb-1"
                >
                  <span class="text-secondary me-2 font-weight-bold">•</span>
                  <span class="text-body-1 font-weight-light">{{ item }}</span>
                </div>

                <p class="mt-4">
                  Whether you're creating a lush garden layout, building whimsical scenes with
                  bright colours, or engineering a detailed replica complete with smoke, sound, and
                  lighting, there’s no single “right way” to build a railway. Each layout is as
                  unique as the family behind it.
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-h6 font-weight-bold text-primary mb-2">
                  A Family-Friendly Hobby
                </div>
                <p class="mb-4">
                  RMGR is built around the idea that model railroading should be accessible and
                  enjoyable for all ages. Our club includes parents, children, and grandparents,
                  working side-by-side. G-Scale trains are ideal for outdoor use and easier for
                  small hands (and aging eyes) to appreciate.
                </p>
                <p>
                  There’s something for everyone—laying track, gardening, building models, running
                  trains, or just enjoying the ride.
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <v-card class="w-100 text-surface" color="transparent" flat>
          <v-row class="mb-6">
            <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-3">Community Engagement</div>
              <p class="mb-4 opacity-90">
                We're proud to share our love of trains with the wider community through:
              </p>

              <div
                v-for="(item, index) in communityEngagementList"
                :key="index"
                class="d-flex align-start mb-2"
              >
                <span class="text-secondary me-2 font-weight-bold mt-n1">•</span>
                <span class="text-body-1 font-weight-light opacity-90">{{ item }}</span>
              </div>

              <p class="mt-4 opacity-80">
                We believe in giving back and bringing smiles to the public through interactive,
                eye-catching model railway experiences.
              </p>
            </v-col>

            <v-col cols="12" md="5">
              <div class="text-h5 font-weight-bold mb-3">Annual Highlights</div>
              <p class="mb-4 opacity-90">
                One of the most anticipated events is our annual Garden Tour, which is open to
                anyone interested. It’s usually held in July or August.
              </p>
              <p class="opacity-90">
                Members visit a series of club members' layouts, offering a chance to showcase
                progress, exchange ideas and inspiration, and enjoy the hobby through someone else's
                perspective. The day often wraps up with a casual BBQ.
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>

          <v-row>
            <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-1">Our Club Membership</div>
              <div class="text-body-1 text-secondary font-weight-bold mb-3">
                Just $40 per family annually
              </div>
              <p class="mb-3 opacity-90">Dues include full access to:</p>

              <div v-for="(item, index) in clubList" :key="index" class="d-flex align-center mb-1">
                <span class="text-secondary me-2 font-weight-bold">•</span>
                <span class="text-body-1 font-weight-light opacity-90">{{ item }}</span>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-4">Our Aims & Objectives</div>

              <div
                v-for="(item, index) in aimsObjectivesList"
                :key="index"
                class="d-flex align-start mb-2"
              >
                <span class="text-secondary me-2 font-weight-bold mt-n1">•</span>
                <span class="text-body-1 font-weight-light opacity-90">{{ item }}</span>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>

          <v-row align="center" class="pt-2">
            <v-col class="mb-4 mb-sm-0" cols="12" sm="8">
              <div class="text-h5 font-weight-bold mb-1">Ready to Join Us?</div>
              <div class="text-body-1 font-weight-light opacity-80">
                Whether you're a lifelong railroader or have a newfound interest in G-Scale trains,
                RMGR welcomes all.
              </div>
            </v-col>
            <v-col class="text-sm-right" cols="12" sm="4">
              <v-btn
                :to="{ name: 'Contact Us' }"
                block
                class="font-weight-bold"
                color="secondary"
                flat
                size="large"
              >
                Contact Us
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import highlightImage from '@/assets/20090620_1024.jpg'

defineOptions({ name: 'AboutUs' })

const whatWeDoList = ref([
  'Landscaping & gardening',
  'Model building & painting',
  'Electronics & automation',
  '3D printing',
  'Storytelling & design',
])

const communityEngagementList = ref([
  'Public exhibits at Supertrain (The largest model train convention in Canada)',
  'Holiday display at the Calgary Zoo during their Zoo Lights festival',
  'Displays at Aspen Crossing on Father’s Day',
  'Layouts at hospitals, retirement homes, and fundraisers',
])

const clubList = ref([
  'Our video library',
  'Expert guidance from experienced modellers',
  'Club events, tours, and layout visits',
  'Invitations to “work parties” on layouts',
])

const aimsObjectivesList = ref([
  'Promote the hobby of Large Scale Model Railroading',
  'Encourage and assist new members entering the hobby',
  'Have fun and enjoy good fellowship through modelling and operations',
  'Support each other with technical and physical assistance',
  'Serve the public by operating layouts at train shows, hospitals, and retirement homes',
])
</script>

<style scoped>
p {
  line-height: 1.6 !important;
}
</style>
