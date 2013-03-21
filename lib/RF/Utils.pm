use strict;
use warnings;
package RF::Utils;

# ABSTRACT: Module with utilities for RF decoding and encoding

=head1 SYNOPSIS

  use RF::Utils qw/:all/;

  my $expected = 80;
  my $actual = 78;
  if (within_error_margin($actual, $expected)) {
    print "close enough\n";
  }

=cut

use 5.006;
require Exporter;
our @ISA = qw(Exporter);
our %EXPORT_TAGS = ( 'all' => [ qw(within_error_margin
) ] );
our @EXPORT_OK = ( @{ $EXPORT_TAGS{'all'} } );
our @EXPORT = qw(
);
our $VERSION = '0.01';

use constant {
  ERROR_MARGIN => $ENV{RF_ERROR_MARGIN} || 0.2,
};

sub within_error_margin {
  my ($actual, $expected) = @_;
  my $err = ERROR_MARGIN * $expected;
  return abs($expected - $actual) < $err;
}

1;
