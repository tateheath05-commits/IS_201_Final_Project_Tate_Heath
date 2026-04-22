/*!
* Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {


    // Navbar shrink function and masthead text color toggle
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        const masthead = document.body.querySelector('.masthead');
        if (!navbarCollapsible || !masthead) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink');
            masthead.classList.remove('scrolled');
        } else {
            navbarCollapsible.classList.add('navbar-shrink');
            masthead.classList.add('scrolled');
        }
    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    //  Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Update outgoing email subject using the visitor's name.
    const contactForm = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailSubject = document.getElementById('emailSubject');

    if (contactForm && nameInput && emailSubject) {
        contactForm.addEventListener('submit', () => {
            const cleanName = nameInput.value.trim();
            emailSubject.value = cleanName ? `Message from ${cleanName}` : 'Message from Website Visitor';
        });
    }

});
