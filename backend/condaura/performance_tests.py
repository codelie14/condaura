"""
Tests de charge pour Condaura
Utilise locust pour simuler plusieurs utilisateurs accédant à l'application simultanément.

Pour exécuter les tests:
1. Installer locust: pip install locust
2. Lancer le serveur Django en mode développement
3. Exécuter: locust -f performance_tests.py
4. Ouvrir http://localhost:8089 dans un navigateur
"""

import time
import json
import random
from locust import HttpUser, task, between
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime

# Paramètres globaux
ADMIN_USERNAME = "admin@example.com"
ADMIN_PASSWORD = "password123"

class AdminUser(HttpUser):
    """
    Simule un utilisateur administrateur qui effectue diverses tâches administratives
    """
    
    # Attendre entre 1 et 3 secondes entre les tâches
    wait_time = between(1, 3)
    
    def on_start(self):
        """Se connecter au démarrage"""
        response = self.client.post("/api/token/", {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            self.token = response.json()["access"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            print(f"Échec de connexion: {response.status_code}")
    
    @task(2)
    def view_users(self):
        """Consulter la liste des utilisateurs"""
        self.client.get("/api/users/", headers=self.headers)
    
    @task(3)
    def view_campaigns(self):
        """Consulter la liste des campagnes"""
        self.client.get("/api/campaigns/", headers=self.headers)
    
    @task(2)
    def view_accesses(self):
        """Consulter la liste des accès"""
        self.client.get("/api/access/", headers=self.headers)
    
    @task(1)
    def view_dashboard(self):
        """Consulter le tableau de bord"""
        self.client.get("/api/campaigns/dashboard/", headers=self.headers)
    
    @task
    def create_campaign(self):
        """Créer une nouvelle campagne"""
        today = timezone.now().date()
        
        campaign_data = {
            "name": f"Test Campaign {random.randint(1000, 9999)}",
            "description": "Campagne de test créée par les tests de charge",
            "start_date": today.isoformat(),
            "end_date": (today + datetime.timedelta(days=7)).isoformat(),
            "status": "draft"
        }
        
        self.client.post("/api/campaigns/", json=campaign_data, headers=self.headers)

class ReviewerUser(HttpUser):
    """
    Simule un utilisateur réviseur qui effectue des revues d'accès
    """
    
    # Attendre entre 2 et 5 secondes entre les tâches
    wait_time = between(2, 5)
    
    def on_start(self):
        """Se connecter au démarrage avec un compte réviseur"""
        # Dans un cas réel, on utiliserait des identifiants générés dynamiquement
        response = self.client.post("/api/token/", {
            "username": "reviewer@example.com",
            "password": "password123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            # Récupérer les revues assignées
            reviews_response = self.client.get("/api/reviews/?decision=pending", headers=self.headers)
            if reviews_response.status_code == 200:
                self.pending_reviews = reviews_response.json()["results"]
        else:
            print(f"Échec de connexion: {response.status_code}")
    
    @task(3)
    def view_assigned_reviews(self):
        """Consulter les revues assignées"""
        self.client.get("/api/reviews/", headers=self.headers)
    
    @task(1)
    def complete_review(self):
        """Compléter une revue en l'approuvant ou la rejetant"""
        # Récupérer les revues en attente
        reviews_response = self.client.get("/api/reviews/?decision=pending", headers=self.headers)
        
        if reviews_response.status_code == 200:
            pending_reviews = reviews_response.json()["results"]
            
            if pending_reviews:
                # Choisir une revue au hasard
                review = random.choice(pending_reviews)
                
                # Décider d'approuver ou de rejeter (80% d'approbation)
                decision = "approved" if random.random() < 0.8 else "rejected"
                
                # Mettre à jour la revue
                review_data = {
                    "decision": decision,
                    "comment": f"Revue {decision} par le test de charge"
                }
                
                self.client.patch(
                    f"/api/reviews/{review['id']}/",
                    json=review_data,
                    headers=self.headers
                )
    
    @task(2)
    def view_campaigns(self):
        """Consulter les campagnes actives"""
        self.client.get("/api/campaigns/?status=active", headers=self.headers)

class RegularUser(HttpUser):
    """
    Simule un utilisateur standard qui consulte ses accès et les revues les concernant
    """
    
    # Attendre entre 3 et 8 secondes entre les tâches
    wait_time = between(3, 8)
    
    def on_start(self):
        """Se connecter au démarrage avec un compte utilisateur"""
        # Dans un cas réel, on utiliserait des identifiants générés dynamiquement
        response = self.client.post("/api/token/", {
            "username": "user@example.com",
            "password": "password123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            print(f"Échec de connexion: {response.status_code}")
    
    @task(3)
    def view_profile(self):
        """Consulter son profil"""
        self.client.get("/api/users/me/", headers=self.headers)
    
    @task(2)
    def view_notifications(self):
        """Consulter ses notifications"""
        self.client.get("/api/users/notifications/", headers=self.headers)
    
    @task(1)
    def view_accesses(self):
        """Consulter ses accès"""
        self.client.get("/api/access/", headers=self.headers) 