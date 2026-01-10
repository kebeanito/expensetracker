package com.example.expensetracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    // Root URL
    @GetMapping("/")
    public String home() {
        return "Expense Tracker API is running!";
    }

    // Optional: a status check for monitoring
    @GetMapping("/status")
    public String status() {
        return "OK";
    }
}
