<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
</script>

<template>
  <!-- IonApp + IonRouterOutlet give us native-style page transitions and
       the back-swipe gesture on mobile. Layout shells come in Phase 2. -->
  <IonApp>
    <IonRouterOutlet />
  </IonApp>
</template>
