exports.noPageFound = (req, res) => {
    res.status(404).render('page-not-found', {pageTitle: 'Page Not Found!', path: '404'});
}