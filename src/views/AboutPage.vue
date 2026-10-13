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
                  family-focused club of approximately 25 member families who build, operate, and
                  display large-scale railways—both indoors and out.
                </p>
                <p class="mb-0">
                  Our mission is to promote the hobby of large-scale model railroading, support one
                  another's creative efforts, and share the joy of trains with our community.
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <div class="content-image-frame elevation-4">
                  <ExpandableImage :src="highlightImage" alt="RMGR garden railway highlight" />
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-6 opacity-10"></v-divider>

            <v-row class="mt-2">
              <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
                <div class="text-h6 font-weight-bold text-primary mb-2">What We Do</div>
                <p class="mb-3">Garden railroading is a multidisciplinary hobby that blends:</p>

                <p class="text-body-1 font-weight-light">
                  Landscaping and gardening, model making, painting, electronics, 3D printing,
                  and storytelling and design.
                </p>

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
                  The RMGR believes that model railroading should be accessible for everyone. Our
                  club includes parents, children, and grandparents, working side-by-side. G-Scale
                  trains are large, which makes them ideal for outdoor use and easier for small
                  hands (and aging eyes) to appreciate.
                </p>
                <p>
                  There’s something for everyone—running trains, gardening, laying track, building
                  models, or just enjoying the social aspects of the club.
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
                We're proud to share our love of trains with our community through:
              </p>

              <p class="opacity-90">
                A layout every year at Supertrain, the largest model train convention in Canada;
                holiday displays at the Calgary Zoo during their Zoo Lights festival; displays at
                Aspen Crossing on Father's Day; and layouts at hospitals, retirement homes, and
                more.
              </p>
            </v-col>

            <v-col cols="12" md="5">
              <div class="text-h5 font-weight-bold mb-3">Annual Events</div>
              <p class="mb-4 opacity-90">
                One of the most anticipated events is our annual Garden Tour, which is open to
                anyone interested. It’s usually held in July or August.
              </p>
              <p class="opacity-90">
                Members visit a series of club members' layouts, offering a chance to showcase
                progress, exchange ideas and inspiration, and enjoy the hobby through someone else's
                perspective. The day often wraps up with a casual BBQ or dinner.
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>

          <v-row>
            <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-1">Membership</div>
              <div class="text-body-1 text-secondary font-weight-bold mb-3">
                Just $40 per family annually
              </div>
              <p class="mb-3 opacity-90">Membership Includes:</p>

              <p class="text-body-1 font-weight-light opacity-90">
                Access to our video library, expert guidance from experienced
                members, club events, tours and layout visits, and invitations to work parties
                on layouts.
              </p>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-4">Objectives</div>

              <p class="text-body-1 font-weight-light opacity-90">
                We promote the hobby of Large Scale Model Railroading, encourage and assist new
                members entering the hobby, have fun and enjoy good fellowship through modelling
                and events, support each other with technical and physical assistance, and
                serve the public by operating layouts at train shows and other non-profit events.
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>

          <v-row align="center" class="pt-2">
            <v-col class="mb-4 mb-sm-0" cols="12" sm="8">
              <div class="text-h5 font-weight-bold mb-1">Interested in Joining?</div>
              <div class="text-body-1 font-weight-light opacity-80">
                Whether you're a lifelong train fan or have a newfound interest in G-Scale trains,
                the RMGR welcomes all.
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
import ExpandableImage from '@/components/ExpandableImage.vue'
import highlightImage from '@/assets/images/featured/20090620_1024.jpg'

defineOptions({ name: 'AboutUs' })
</script>

<style scoped>
p {
  line-height: 1.6 !important;
}
</style>
